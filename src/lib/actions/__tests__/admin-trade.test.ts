/**
 * @jest-environment node
 */

// 取扱店の審査。承認するまで卸価格は出ないので、**この機能より前に登録した
// （行が無い）法人も承認できる**ことが要。upsert が効かないと、既存のお客様が
// 永久に未承認のままになる。

import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";

let sqlite: DatabaseSync;

function makeDb() {
  return drizzle(async (sql, params, method) => {
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

jest.mock("@/db", () => ({ getDb: async () => makeDb() }));

const getSession = jest.fn();
jest.mock("@/lib/auth", () => ({ getAuth: async () => ({ api: { getSession } }) }));
jest.mock("next/headers", () => ({ headers: async () => new Headers() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

let adminRole: string | null = "owner";
jest.mock("@/lib/admin", () => ({
  getEffectiveAdminRole: async () => adminRole,
  isStaffOrAbove: (r: unknown) => r === "owner" || r === "staff",
}));

const sendTradeApprovedEmail = jest.fn();
const sendTradeRejectedEmail = jest.fn();
jest.mock("@/lib/emails/trade-emails", () => ({
  sendTradeApprovedEmail: (...a: unknown[]) => sendTradeApprovedEmail(...a),
  sendTradeRejectedEmail: (...a: unknown[]) => sendTradeRejectedEmail(...a),
}));

import { adminReviewTradeAccountAction } from "@/lib/actions/admin-trade";

function seedUser(id: string, role = "business") {
  sqlite
    .prepare(
      "INSERT INTO user (id, name, email, email_verified, role, company_name, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?, 0, 0)",
    )
    .run(id, "佐々木 優子", `${id}@example.com`, role, "鮨青山");
}

function readAccount(userId: string) {
  return sqlite
    .prepare("SELECT * FROM trade_account WHERE user_id = ?")
    .get(userId) as Record<string, unknown> | undefined;
}

beforeEach(() => {
  jest.clearAllMocks();
  adminRole = "owner";
  getSession.mockResolvedValue({
    user: { id: "admin_1", email: "owner@example.com" },
  });
  sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`
    CREATE TABLE user (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      email_verified INTEGER NOT NULL,
      image TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      role TEXT,
      company_name TEXT,
      phone TEXT,
      address TEXT,
      postal_code TEXT,
      admin_role TEXT
    );
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

describe("adminReviewTradeAccountAction", () => {
  it("申請行が無い法人でも承認できる（旧アカウントの救済）", async () => {
    seedUser("u_legacy");

    const res = await adminReviewTradeAccountAction({
      userId: "u_legacy",
      status: "approved",
    });

    expect(res).toEqual({ ok: true });
    expect(readAccount("u_legacy")).toMatchObject({
      status: "approved",
      business_type: "other",
      reviewed_by_email: "owner@example.com",
    });
    expect(sendTradeApprovedEmail).toHaveBeenCalledTimes(1);
  });

  it("既存の申請は業態を保ったまま承認する", async () => {
    seedUser("u_1");
    sqlite
      .prepare(
        "INSERT INTO trade_account (user_id, status, business_type, licence_number, applied_at) VALUES ('u_1', 'pending', 'retailer', '静岡税務署 第1号', 0)",
      )
      .run();

    await adminReviewTradeAccountAction({ userId: "u_1", status: "approved" });

    expect(readAccount("u_1")).toMatchObject({
      status: "approved",
      business_type: "retailer",
      licence_number: "静岡税務署 第1号",
    });
  });

  it("見送りは理由を残し、お客様に知らせる", async () => {
    seedUser("u_2");

    await adminReviewTradeAccountAction({
      userId: "u_2",
      status: "rejected",
      note: "免許の確認が取れなかったため",
    });

    expect(readAccount("u_2")).toMatchObject({
      status: "rejected",
      review_note: "免許の確認が取れなかったため",
    });
    expect(sendTradeRejectedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ note: "免許の確認が取れなかったため" }),
    );
  });

  it("承認を取り消して見送りに戻せる", async () => {
    seedUser("u_3");
    await adminReviewTradeAccountAction({ userId: "u_3", status: "approved" });
    await adminReviewTradeAccountAction({ userId: "u_3", status: "rejected" });

    expect(readAccount("u_3")).toMatchObject({ status: "rejected" });
  });

  it("staff 未満は審査できない", async () => {
    seedUser("u_4");
    adminRole = null;

    expect(
      await adminReviewTradeAccountAction({ userId: "u_4", status: "approved" }),
    ).toEqual({ ok: false, error: "forbidden" });
    expect(readAccount("u_4")).toBeUndefined();
  });

  it("個人アカウントは取扱店として承認できない", async () => {
    seedUser("u_5", "personal");

    expect(
      await adminReviewTradeAccountAction({ userId: "u_5", status: "approved" }),
    ).toEqual({ ok: false, error: "notfound" });
    expect(readAccount("u_5")).toBeUndefined();
  });

  it("未知のステータスは受け付けない", async () => {
    seedUser("u_6");

    expect(
      await adminReviewTradeAccountAction({
        userId: "u_6",
        // UI を迂回した直接呼び出しを想定
        status: "pending" as "approved",
      }),
    ).toEqual({ ok: false, error: "invalid" });
  });

  it("メール送信に失敗しても審査結果は確定させる", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    seedUser("u_7");
    sendTradeApprovedEmail.mockRejectedValue(new Error("resend down"));

    const res = await adminReviewTradeAccountAction({
      userId: "u_7",
      status: "approved",
    });
    errSpy.mockRestore();

    expect(res).toEqual({ ok: true });
    expect(readAccount("u_7")).toMatchObject({ status: "approved" });
  });
});
