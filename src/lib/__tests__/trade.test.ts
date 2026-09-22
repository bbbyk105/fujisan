/**
 * @jest-environment node
 */

// 卸価格を見せてよいかの判定。ここが緩むと、自己申告で登録しただけの相手に
// 取引価格が見えてしまう（一度見られた価格は取り消せない）。
// 「行が無い＝未承認」を実際の SQL で確かめたいので、node:sqlite に流す。

import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";

let sqlite: DatabaseSync;
let failNextQuery = false;

function makeDb() {
  return drizzle(async (sql, params, method) => {
    if (failNextQuery) throw new Error("d1 unavailable");
    const stmt = sqlite.prepare(sql);
    if (method === "run") {
      stmt.run(...(params as never[]));
      return { rows: [] };
    }
    const rows = stmt.all(...(params as never[])) as Record<string, unknown>[];
    const asArrays = rows.map((r) => Object.values(r));
    return { rows: method === "get" ? (asArrays[0] ?? []) : asArrays };
  });
}

jest.mock("@/db", () => ({
  getDb: async () => makeDb(),
}));

import {
  canSeeWholesalePricing,
  createTradeApplication,
  readTradeAccount,
} from "@/lib/trade";
import type { TradeStatus } from "@/data/fujisan-trade";

function seed(userId: string, status: TradeStatus) {
  sqlite
    .prepare(
      "INSERT INTO trade_account (user_id, status, business_type, applied_at) VALUES (?, ?, 'restaurant', 0)",
    )
    .run(userId, status);
}

const businessSession = (id: string) => ({
  user: { id, role: "business" },
});

beforeEach(() => {
  failNextQuery = false;
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`
    CREATE TABLE trade_account (
      user_id TEXT PRIMARY KEY NOT NULL,
      status TEXT DEFAULT 'pending' NOT NULL,
      business_type TEXT NOT NULL,
      licence_number TEXT,
      applied_at INTEGER NOT NULL,
      reviewed_at INTEGER,
      reviewed_by_email TEXT,
      review_note TEXT
    );
  `);
});

afterEach(() => sqlite.close());

describe("canSeeWholesalePricing", () => {
  it("承認済みの法人にだけ卸価格を見せる", async () => {
    seed("u_ok", "approved");
    expect(await canSeeWholesalePricing(businessSession("u_ok"))).toBe(true);
  });

  it("審査中・見送りでは見せない", async () => {
    seed("u_pending", "pending");
    seed("u_rejected", "rejected");
    expect(await canSeeWholesalePricing(businessSession("u_pending"))).toBe(false);
    expect(await canSeeWholesalePricing(businessSession("u_rejected"))).toBe(false);
  });

  it("申請行が無い法人（この機能より前の登録）は未承認として扱う", async () => {
    // role だけを条件にしていた頃は、ここで卸価格が見えてしまっていた。
    expect(await canSeeWholesalePricing(businessSession("u_legacy"))).toBe(false);
  });

  it("未ログイン・個人アカウントには見せない", async () => {
    seed("u_person", "approved"); // 万一 approved な行があっても role が違えば不可
    expect(await canSeeWholesalePricing(null)).toBe(false);
    expect(
      await canSeeWholesalePricing({ user: { id: "u_person", role: "personal" } }),
    ).toBe(false);
    expect(await canSeeWholesalePricing({ user: { role: "business" } })).toBe(false);
  });

  it("DB が読めないときは見せない側に倒す", async () => {
    seed("u_ok", "approved");
    failNextQuery = true;
    expect(await canSeeWholesalePricing(businessSession("u_ok"))).toBe(false);
  });
});

describe("createTradeApplication", () => {
  it("審査待ちの行を作る（空の免許番号は null で保存する）", async () => {
    expect(
      await createTradeApplication({
        userId: "u_new",
        businessType: "restaurant",
        licenceNumber: "   ",
      }),
    ).toBe(true);

    const account = await readTradeAccount("u_new");
    expect(account).toMatchObject({
      status: "pending",
      businessType: "restaurant",
      licenceNumber: null,
    });
  });

  it("既にある申請を上書きしない（審査済みを pending に戻さない）", async () => {
    seed("u_ok", "approved");
    await createTradeApplication({ userId: "u_ok", businessType: "retailer" });
    expect((await readTradeAccount("u_ok"))?.status).toBe("approved");
  });

  it("保存に失敗しても登録自体は壊さない（false を返すだけ）", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    failNextQuery = true;
    expect(
      await createTradeApplication({ userId: "u_x", businessType: "hotel" }),
    ).toBe(false);
    errSpy.mockRestore();
  });
});
