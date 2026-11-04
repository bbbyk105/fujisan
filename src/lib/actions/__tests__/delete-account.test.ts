/**
 * @jest-environment node
 */

// 退会しても注文の記録は残す。領収書は適格簡易請求書で写しの保存が要り、
// プライバシーポリシーにも「退会後も税法・商法上必要な期間保存します」と書いている。
//
// 残るかどうかを決めているのは外部キーの ON DELETE なので、スタブで戻り値を
// 作っても確かめたことにならない。実際のマイグレーションを流した SQLite で動かす。

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

jest.mock("next/headers", () => ({ headers: async () => new Headers() }));
// actions/auth.ts が読む部品の依存。ESM のままで jest が読めず、退会では使わない。
jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env: {} }),
}));
jest.mock("@/db", () => ({ getDb: async () => makeDb() }));
const signOut = jest.fn();
jest.mock("@/lib/auth", () => ({
  getAuth: async () => ({
    api: {
      getSession: async () => ({ user: { id: "u_1" } }),
      signOut: (...a: unknown[]) => signOut(...a),
    },
  }),
}));

import { deleteAccountAction } from "@/lib/actions/auth";

function applyMigrations(): void {
  const dir = join(__dirname, "../../../../drizzle");
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    for (const stmt of readFileSync(join(dir, file), "utf8").split(
      "--> statement-breakpoint",
    )) {
      if (stmt.trim()) sqlite.exec(stmt);
    }
  }
}

function seedUser(id: string) {
  sqlite
    .prepare(
      "INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, 1, 0, 0)",
    )
    .run(id, "山田 太郎", `${id}@example.com`);
  sqlite
    .prepare(
      "INSERT INTO session (id, expires_at, token, created_at, updated_at, user_id) VALUES (?, 0, ?, 0, 0, ?)",
    )
    .run(`s_${id}`, `t_${id}`, id);
}

function seedOrder(ref: string, status: string, userId = "u_1") {
  sqlite
    .prepare(
      `INSERT INTO orders (id, user_id, order_ref, status, items_json, items_count,
         subtotal, shipping, total, customer_name, customer_email, postal_code, address, phone)
       VALUES (?, ?, ?, ?, '[]', 1, 2750, 1100, 3850, '山田 太郎', 'taro@example.com',
         '4170051', '静岡県富士市吉原', '0545000000')`,
    )
    .run(`o_${ref}`, userId, ref, status);
}

const orderRow = (ref: string) =>
  sqlite
    .prepare(
      "SELECT user_id, status, total, customer_name, customer_email FROM orders WHERE order_ref = ?",
    )
    .get(ref) as
    | {
        user_id: string | null;
        status: string;
        total: number;
        customer_name: string;
        customer_email: string;
      }
    | undefined;

const count = (table: string) =>
  (sqlite.prepare(`SELECT count(*) AS n FROM ${table}`).get() as { n: number }).n;

beforeEach(() => {
  signOut.mockReset();
  sqlite = new DatabaseSync(":memory:");
  applyMigrations();
  seedUser("u_1");
});

afterEach(() => sqlite.close());

describe("退会", () => {
  it("お届け済みの注文は消えず、金額と宛先を保ったままアカウントとの紐づけだけが外れる", async () => {
    seedOrder("FJ-DELIVERED", "delivered");

    expect(await deleteAccountAction()).toEqual({ ok: true });

    expect(orderRow("FJ-DELIVERED")).toEqual({
      user_id: null,
      status: "delivered",
      total: 3850,
      customer_name: "山田 太郎",
      customer_email: "taro@example.com",
    });
  });

  it("キャンセル・返金済みの注文も記録として残る", async () => {
    seedOrder("FJ-CANCELLED", "cancelled");
    seedOrder("FJ-REFUNDED", "refunded");

    expect(await deleteAccountAction()).toEqual({ ok: true });

    expect(orderRow("FJ-CANCELLED")?.user_id).toBeNull();
    expect(orderRow("FJ-REFUNDED")?.user_id).toBeNull();
  });

  it("アカウントとログイン情報は消える", async () => {
    seedOrder("FJ-DELIVERED", "delivered");

    await deleteAccountAction();

    expect(count("user")).toBe(0);
    expect(count("session")).toBe(0);
    expect(signOut).toHaveBeenCalled();
  });

  it("他のお客様の注文には触れない", async () => {
    seedUser("u_2");
    seedOrder("FJ-OTHER", "delivered", "u_2");

    await deleteAccountAction();

    expect(orderRow("FJ-OTHER")?.user_id).toBe("u_2");
  });

  it.each(["pending", "confirmed", "preparing", "shipped"])(
    "お届け前の注文（%s）があれば退会できず、何も変わらない",
    async (status) => {
      seedOrder("FJ-ACTIVE", status);

      expect(await deleteAccountAction()).toEqual({
        ok: false,
        error: "active-orders",
      });

      expect(count("user")).toBe(1);
      expect(orderRow("FJ-ACTIVE")?.user_id).toBe("u_1");
    },
  );
});
