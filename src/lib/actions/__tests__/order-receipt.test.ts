/**
 * @jest-environment node
 */

// 領収書のリンクは氏名や金額が読める。orderRef は推測しにくいだけで秘密ではないので、
// 他人の注文のリンクを返さないことは、実際の WHERE 句を流して確かめる。

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
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@/db", () => ({ getDb: async () => makeDb() }));

const env: Record<string, string | undefined> = { STRIPE_SECRET_KEY: "sk_test_1" };
jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env }),
}));

let sessionUser: { id: string } | null;
jest.mock("@/lib/auth", () => ({
  getAuth: async () => ({
    api: {
      getSession: async () => (sessionUser ? { user: sessionUser } : null),
    },
  }),
}));

const paymentIntentsRetrieve = jest.fn();
const sessionsRetrieve = jest.fn();
jest.mock("@/lib/stripe", () => ({
  ...jest.requireActual("@/lib/stripe"),
  getStripe: () => ({
    paymentIntents: { retrieve: paymentIntentsRetrieve },
    checkout: { sessions: { retrieve: sessionsRetrieve } },
  }),
}));

import { getMyOrderReceiptUrlAction } from "@/lib/actions/orders";

const RECEIPT_URL = "https://pay.stripe.com/receipts/payment/fresh";

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
    .run(id, id, `${id}@example.com`);
}

function seedOrder(
  ref: string,
  status: string,
  userId: string | null = "u_1",
  paymentIntentId: string | null = "pi_1",
  sessionId: string | null = null,
) {
  sqlite
    .prepare(
      `INSERT INTO orders (id, user_id, order_ref, status, items_json, items_count,
         subtotal, shipping, total, customer_name, customer_email, postal_code, address, phone,
         stripe_payment_intent_id, stripe_session_id)
       VALUES (?, ?, ?, ?, '[]', 1, 2750, 1100, 3850, '', '', '', '', '', ?, ?)`,
    )
    .run(`o_${ref}`, userId, ref, status, paymentIntentId, sessionId);
}

beforeEach(() => {
  jest.clearAllMocks();
  sessionUser = { id: "u_1" };
  env.STRIPE_SECRET_KEY = "sk_test_1";
  sqlite = new DatabaseSync(":memory:");
  applyMigrations();
  seedUser("u_1");
  seedUser("u_2");
  paymentIntentsRetrieve.mockResolvedValue({
    latest_charge: { receipt_url: RECEIPT_URL },
  });
});

afterEach(() => sqlite.close());

describe("getMyOrderReceiptUrlAction", () => {
  it("自分の注文なら、Stripe から取り直したリンクを返す", async () => {
    seedOrder("FJ-MINE", "delivered");

    expect(await getMyOrderReceiptUrlAction("FJ-MINE")).toBe(RECEIPT_URL);
    expect(paymentIntentsRetrieve).toHaveBeenCalledWith("pi_1", {
      expand: ["latest_charge"],
    });
  });

  it("他人の注文には返さず、Stripe にも問い合わせない", async () => {
    seedOrder("FJ-OTHER", "delivered", "u_2");

    expect(await getMyOrderReceiptUrlAction("FJ-OTHER")).toBeNull();
    expect(paymentIntentsRetrieve).not.toHaveBeenCalled();
  });

  it("未ログインには返さない", async () => {
    seedOrder("FJ-MINE", "delivered");
    sessionUser = null;

    expect(await getMyOrderReceiptUrlAction("FJ-MINE")).toBeNull();
  });

  it.each(["pending", "cancelled", "refunded"])(
    "領収書を出さないステータス（%s）には返さない",
    async (status) => {
      seedOrder("FJ-MINE", status);
      expect(await getMyOrderReceiptUrlAction("FJ-MINE")).toBeNull();
    },
  );

  it.each(["confirmed", "preparing", "shipped", "delivered"])(
    "入金済みのステータス（%s）には返す",
    async (status) => {
      seedOrder("FJ-MINE", status);
      expect(await getMyOrderReceiptUrlAction("FJ-MINE")).toBe(RECEIPT_URL);
    },
  );

  it("決済の記録が無い注文には返さない", async () => {
    seedOrder("FJ-MINE", "delivered", "u_1", null);

    expect(await getMyOrderReceiptUrlAction("FJ-MINE")).toBeNull();
    expect(paymentIntentsRetrieve).not.toHaveBeenCalled();
  });

  // Webhook を取りこぼし、管理画面で確定した注文は PaymentIntent の記録が無い。
  it("PaymentIntent の記録が無くても、Checkout Session から引き直す", async () => {
    seedOrder("FJ-MINE", "confirmed", "u_1", null, "cs_1");
    sessionsRetrieve.mockResolvedValue({ payment_intent: "pi_from_session" });

    expect(await getMyOrderReceiptUrlAction("FJ-MINE")).toBe(RECEIPT_URL);
    expect(paymentIntentsRetrieve).toHaveBeenCalledWith("pi_from_session", {
      expand: ["latest_charge"],
    });
  });

  // 本番キーへ切り替えると、sandbox の注文の支払いは見つからない。
  // 再試行しても必ず失敗するので、エラー画面ではなく 404 にする。
  it("Stripe に支払いが見つからなければ null を返す", async () => {
    seedOrder("FJ-MINE", "delivered");
    paymentIntentsRetrieve.mockRejectedValue(
      Object.assign(new Error("No such payment_intent"), {
        code: "resource_missing",
      }),
    );

    expect(await getMyOrderReceiptUrlAction("FJ-MINE")).toBeNull();
  });

  it("秘密鍵が未設定なら 404 に見せず、設定の問題として投げる", async () => {
    seedOrder("FJ-MINE", "delivered");
    env.STRIPE_SECRET_KEY = undefined;

    await expect(getMyOrderReceiptUrlAction("FJ-MINE")).rejects.toThrow(
      "STRIPE_SECRET_KEY",
    );
  });

  it("Stripe 側に領収書が無ければ null を返す", async () => {
    seedOrder("FJ-MINE", "delivered");
    paymentIntentsRetrieve.mockResolvedValue({
      latest_charge: { receipt_url: null },
    });

    expect(await getMyOrderReceiptUrlAction("FJ-MINE")).toBeNull();
  });

  it("Stripe の障害は 404 に見せず、そのまま投げる（画面の再試行に任せる）", async () => {
    seedOrder("FJ-MINE", "delivered");
    paymentIntentsRetrieve.mockRejectedValue(new Error("stripe down"));

    await expect(getMyOrderReceiptUrlAction("FJ-MINE")).rejects.toThrow(
      "stripe down",
    );
  });
});
