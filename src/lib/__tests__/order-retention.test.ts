/**
 * @jest-environment node
 */

// 退会したお客様の個人情報を、いつまでも持ち続けないための掃除。
// 消しすぎると税務の記録が失われ、消し足りないとポリシーの約束が守れないので、
// 実際のマイグレーションを流した SQLite に drizzle の SQL を流して確かめる。

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
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

let dbAvailable = true;
jest.mock("@/db", () => ({
  getDb: async () => {
    if (!dbAvailable) throw new Error("D1 unavailable");
    return makeDb();
  },
}));

import {
  anonymizeExpiredOrders,
  deleteExpiredContacts,
  sweepExpiredPersonalData,
} from "@/lib/order-retention";
import { ORDER_PII_RETENTION_YEARS } from "@/data/fujisan-orders";
import { CONTACT_RETENTION_YEARS } from "@/data/fujisan-contact";

const NOW = new Date("2036-01-15T00:00:00Z");
/** 保存期間ちょうどの境目。 */
const CUTOFF = new Date(NOW);
CUTOFF.setUTCFullYear(CUTOFF.getUTCFullYear() - ORDER_PII_RETENTION_YEARS);
const DAY = 86_400_000;

function applyMigrations(): void {
  const dir = join(__dirname, "../../../drizzle");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    for (const stmt of readFileSync(join(dir, file), "utf8").split(
      "--> statement-breakpoint",
    )) {
      if (stmt.trim()) sqlite.exec(stmt);
    }
  }
}

function seedOrder(ref: string, createdAt: number, userId: string | null = null) {
  sqlite
    .prepare(
      `INSERT INTO orders (id, user_id, order_ref, status, items_json, items_count,
         subtotal, shipping, total, customer_name, customer_email, postal_code, address, phone,
         receipt_addressee, cancel_reason, tracking_carrier, tracking_number, paid_at,
         stripe_session_id, stripe_payment_intent_id, stripe_refund_id,
         created_at, updated_at)
       VALUES (?, ?, ?, 'delivered', '[{"slug":"shogun"}]', 1, 2750, 1100, 3850,
         '山田 太郎', 'taro@example.com', '4170051', '静岡県富士市吉原', '0545000000',
         '上様', '都合が変わりました', 'ヤマト', '1234-5678', ?,
         'cs_1', 'pi_1', 're_1', ?, ?)`,
    )
    .run(`o_${ref}`, userId, ref, createdAt, createdAt, createdAt);
}

const row = (ref: string) =>
  sqlite.prepare("SELECT * FROM orders WHERE order_ref = ?").get(ref) as Record<
    string,
    unknown
  >;

beforeEach(() => {
  dbAvailable = true;
  sqlite = new DatabaseSync(":memory:");
  applyMigrations();
  sqlite.exec(
    "INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES ('u_1', '会員', 'm@example.com', 1, 0, 0)",
  );
});

afterEach(() => sqlite.close());

describe("anonymizeExpiredOrders", () => {
  it("法定の保存期間（取引から最長 約 8 年 3 か月）より短くしない", () => {
    expect(ORDER_PII_RETENTION_YEARS).toBeGreaterThanOrEqual(9);
  });

  it("保存期間を過ぎた退会者の注文から、個人を特定できる情報を消す", async () => {
    seedOrder("FJ-OLD", CUTOFF.getTime() - DAY);

    expect(await anonymizeExpiredOrders(NOW)).toBe(1);

    expect(row("FJ-OLD")).toMatchObject({
      customer_name: "",
      customer_email: "",
      postal_code: "",
      address: "",
      phone: "",
      receipt_addressee: null,
      cancel_reason: null,
      tracking_number: null,
    });
  });

  // Stripe には氏名や住所が残っている。ID があると、そこへたどれてしまう。
  it("Stripe の ID も消す（Stripe 側の個人情報へたどれないようにする）", async () => {
    seedOrder("FJ-OLD", CUTOFF.getTime() - DAY);

    await anonymizeExpiredOrders(NOW);

    expect(row("FJ-OLD")).toMatchObject({
      stripe_session_id: null,
      stripe_payment_intent_id: null,
      stripe_refund_id: null,
    });
  });

  it("メールだけが空の行も消し漏らさない", async () => {
    seedOrder("FJ-NOMAIL", CUTOFF.getTime() - DAY);
    sqlite.exec("UPDATE orders SET customer_email = '' WHERE order_ref = 'FJ-NOMAIL'");

    expect(await anonymizeExpiredOrders(NOW)).toBe(1);
    expect(row("FJ-NOMAIL").address).toBe("");
  });

  it("金額・品目・日付・注文番号は税務の記録として残す", async () => {
    const createdAt = CUTOFF.getTime() - DAY;
    seedOrder("FJ-OLD", createdAt);

    await anonymizeExpiredOrders(NOW);

    expect(row("FJ-OLD")).toMatchObject({
      order_ref: "FJ-OLD",
      status: "delivered",
      items_json: '[{"slug":"shogun"}]',
      items_count: 1,
      subtotal: 2750,
      shipping: 1100,
      total: 3850,
      paid_at: createdAt,
      created_at: createdAt,
    });
  });

  it("保存期間内の退会者の注文には触れない", async () => {
    seedOrder("FJ-RECENT", CUTOFF.getTime() + DAY);

    expect(await anonymizeExpiredOrders(NOW)).toBe(0);
    expect(row("FJ-RECENT").customer_name).toBe("山田 太郎");
  });

  it("会員の注文は、古くても触れない", async () => {
    seedOrder("FJ-MEMBER", CUTOFF.getTime() - DAY, "u_1");

    expect(await anonymizeExpiredOrders(NOW)).toBe(0);
    expect(row("FJ-MEMBER").address).toBe("静岡県富士市吉原");
  });

  it("2 回目は何も更新しない（消した行を毎回書き直さない）", async () => {
    seedOrder("FJ-OLD", CUTOFF.getTime() - DAY);

    await anonymizeExpiredOrders(NOW);
    const updatedAt = row("FJ-OLD").updated_at;

    expect(await anonymizeExpiredOrders(NOW)).toBe(0);
    expect(row("FJ-OLD").updated_at).toBe(updatedAt);
  });

  it("DB が読めなくても例外を投げない（管理画面を止めない）", async () => {
    dbAvailable = false;
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    expect(await anonymizeExpiredOrders(NOW)).toBe(0);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

describe("deleteExpiredContacts", () => {
  const contactCutoff = () => {
    const d = new Date(NOW);
    d.setUTCFullYear(d.getUTCFullYear() - CONTACT_RETENTION_YEARS);
    return d.getTime();
  };

  function seedContact(id: string, createdAt: number) {
    sqlite
      .prepare(
        `INSERT INTO contact_message (id, name, email, subject, message, created_at)
         VALUES (?, '山田 太郎', 'taro@example.com', 'general', '本文', ?)`,
      )
      .run(id, createdAt);
  }

  const contactIds = () =>
    (
      sqlite.prepare("SELECT id FROM contact_message ORDER BY id").all() as Array<{
        id: string;
      }>
    ).map((r) => r.id);

  it("保存期間を過ぎたお問い合わせを消し、期間内のものは残す", async () => {
    seedContact("c_old", contactCutoff() - DAY);
    seedContact("c_recent", contactCutoff() + DAY);

    expect(await deleteExpiredContacts(NOW)).toBe(1);
    expect(contactIds()).toEqual(["c_recent"]);
  });

  it("DB が読めなくても例外を投げない", async () => {
    dbAvailable = false;
    const consoleError = jest.spyOn(console, "error").mockImplementation();

    expect(await deleteExpiredContacts(NOW)).toBe(0);
    consoleError.mockRestore();
  });
});

describe("sweepExpiredPersonalData", () => {
  it("注文とお問い合わせの両方を掃除し、消した件数を記録に残す", async () => {
    const consoleInfo = jest.spyOn(console, "info").mockImplementation();
    seedOrder("FJ-OLD", CUTOFF.getTime() - DAY);

    await sweepExpiredPersonalData(NOW);

    expect(row("FJ-OLD").customer_name).toBe("");
    expect(consoleInfo).toHaveBeenCalledTimes(1);
    consoleInfo.mockRestore();
  });

  it("何も消さなかったときは記録を残さない", async () => {
    const consoleInfo = jest.spyOn(console, "info").mockImplementation();

    await sweepExpiredPersonalData(NOW);

    expect(consoleInfo).not.toHaveBeenCalled();
    consoleInfo.mockRestore();
  });
});
