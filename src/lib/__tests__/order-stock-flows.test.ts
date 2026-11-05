/**
 * @jest-environment node
 */

// 在庫の本数は、注文がどの順で動いても実際の本数と合っていなければならない。
//
// 判定を間違えて困るのは SQL の条件なので、スタブで戻り値を作らず、node:sqlite に
// 実マイグレーションを流して本物の処理を通す。在庫を見るのはこの DB だけで、
// モックするのは認証・Stripe・メール・運用通知といった外側だけ。

import { readFileSync, readdirSync } from "node:fs";
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

jest.mock("@/db", () => ({ getDb: async () => makeDb() }));
jest.mock("next/headers", () => ({ headers: async () => new Headers() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({
    env: { STRIPE_SECRET_KEY: "sk_test_1", STRIPE_WEBHOOK_SECRET: "whsec_1" },
  }),
}));
/** ログイン中の利用者。null ならゲスト。 */
let sessionUser: { id: string; email: string } | null;
jest.mock("@/lib/auth", () => ({
  getAuth: async () => ({
    api: {
      getSession: async () => (sessionUser ? { user: sessionUser } : null),
    },
  }),
}));
jest.mock("@/lib/admin", () => ({
  getEffectiveAdminRole: async () => "owner",
  isOwner: () => true,
  isStaffOrAbove: () => true,
}));

const alertOps = jest.fn();
jest.mock("@/lib/ops-alert", () => ({
  alertOps: (...a: unknown[]) => alertOps(...a),
}));

const verifyStripeSignature = jest.fn();
const refundsCreate = jest.fn();
const sessionsRetrieve = jest.fn();
const sessionsExpire = jest.fn();
jest.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        retrieve: (...a: unknown[]) => sessionsRetrieve(...a),
        expire: (...a: unknown[]) => sessionsExpire(...a),
      },
    },
    refunds: {
      create: (...a: unknown[]) => refundsCreate(...a),
      list: async () => ({ data: [] }),
    },
  }),
  verifyStripeSignature: (...a: unknown[]) => verifyStripeSignature(...a),
}));

const sendOrderRefundedEmail = jest.fn();
jest.mock("@/lib/emails/order-emails", () => ({
  sendOrderRefundedEmail: (...a: unknown[]) => sendOrderRefundedEmail(...a),
  sendOrderConfirmedEmail: jest.fn(),
  sendOrderShippedEmail: jest.fn(),
  sendOrderDeliveredEmail: jest.fn(),
}));

import {
  adminListOrdersAction,
  adminRefundOrderAction,
  adminUpdateOrderAction,
} from "@/lib/actions/admin-orders";
import { releaseAbandonedCheckoutAction } from "@/lib/actions/checkout";
import { POST } from "@/app/api/stripe/webhook/route";

const ORDER_ID = "o_1";
const ON_HAND = 10;

function applyMigrations(): void {
  const dir = join(__dirname, "../../../drizzle");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    for (const stmt of readFileSync(join(dir, file), "utf8").split(
      "--> statement-breakpoint",
    )) {
      if (stmt.trim()) sqlite.exec(stmt);
    }
  }
}

/** 決済を始めた注文を 1 件作る。注文を保存し、在庫を引き当てるところまで。 */
function placeOrder(qty = 2): void {
  const items = JSON.stringify([
    {
      slug: "shogun",
      name: "FUJISAN",
      variant: "SHOGUN",
      ml: 300,
      qty,
      unitPrice: 2750,
      lineTotal: 2750 * qty,
    },
  ]);
  sqlite
    .prepare(
      `INSERT INTO orders (id, user_id, order_ref, status, items_json, items_count,
        subtotal, shipping, total, customer_name, customer_email, postal_code, address, phone,
        stripe_session_id, stripe_payment_intent_id, paid_at, created_at, updated_at)
       VALUES (?, 'u_1', 'FJ-0001', 'pending', ?, ?, ?, 0, ?, '山田 太郎', 'taro@example.com',
        '4170051', '静岡県富士市', '0545000000', 'cs_1', 'pi_1', 1000, 0, 0)`,
    )
    .run(ORDER_ID, items, qty, 2750 * qty, 2750 * qty);
  sqlite
    .prepare(
      "UPDATE inventory SET reserved = reserved + ? WHERE product_slug = 'shogun' AND ml = 300",
    )
    .run(qty);
}

function stock(): { onHand: number; reserved: number } {
  const row = sqlite
    .prepare(
      "SELECT on_hand AS onHand, reserved FROM inventory WHERE product_slug = 'shogun' AND ml = 300",
    )
    .get() as { onHand: number; reserved: number };
  return { onHand: row.onHand, reserved: row.reserved };
}

function orderRow(): { status: string; refundedAmount: number | null } | undefined {
  return sqlite
    .prepare(
      "SELECT status, refunded_amount AS refundedAmount FROM orders WHERE id = ?",
    )
    .get(ORDER_ID) as { status: string; refundedAmount: number | null } | undefined;
}

function stockState(): string {
  const row = sqlite
    .prepare("SELECT stock_state AS stockState FROM orders WHERE id = ?")
    .get(ORDER_ID) as { stockState: string };
  return row.stockState;
}

const setStatus = (status: Parameters<typeof adminUpdateOrderAction>[0]["status"]) =>
  adminUpdateOrderAction({ orderId: ORDER_ID, status });

/** 署名を通した Webhook を 1 回届ける。本文がそのままイベントになる。 */
function deliver(event: unknown): Promise<Response> {
  return POST(
    new Request("https://sakefujisan.com/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: JSON.stringify(event),
    }),
  );
}

const chargeRefunded = (amountRefunded: number) => ({
  type: "charge.refunded",
  data: {
    object: {
      id: "ch_1",
      payment_intent: "pi_1",
      amount_refunded: amountRefunded,
    },
  },
});

beforeEach(() => {
  jest.clearAllMocks();
  sessionUser = { id: "u_1", email: "owner@example.com" };
  sqlite = new DatabaseSync(":memory:");
  applyMigrations();
  sqlite.exec(`
    INSERT INTO user (id, name, email, email_verified, created_at, updated_at)
      VALUES ('u_1', '山田 太郎', 'taro@example.com', 1, 0, 0);
    INSERT INTO inventory (product_slug, ml, on_hand, reserved, updated_at, created_at)
      VALUES ('shogun', 300, ${ON_HAND}, 0, 0, 0);
  `);
  verifyStripeSignature.mockImplementation(async (_s: unknown, body: string) =>
    JSON.parse(body),
  );
  refundsCreate.mockImplementation(async () => ({ id: "re_1" }));
  sessionsRetrieve.mockImplementation(async () => ({ payment_intent: "pi_1" }));
  sessionsExpire.mockReset();
  sessionsExpire.mockResolvedValue({ id: "cs_1", status: "expired" });
  placeOrder();
});

afterEach(() => sqlite.close());

describe("手でステータスを動かしても本数が合う", () => {
  it("取り消した注文を確定へ戻すと引き落とし直し、全額返金で元の本数に戻る", async () => {
    await setStatus("confirmed");
    await setStatus("cancelled");
    expect(stock()).toEqual({ onHand: ON_HAND, reserved: 0 });

    await setStatus("confirmed");
    expect(stock()).toEqual({ onHand: ON_HAND - 2, reserved: 0 });

    await adminRefundOrderAction({ orderId: ORDER_ID });
    expect(stock()).toEqual({ onHand: ON_HAND, reserved: 0 });
  });

  it("確定を手で pending へ戻してまた確定しても、二重に引き落とさない", async () => {
    await setStatus("confirmed");
    await setStatus("pending");
    await setStatus("confirmed");

    expect(stock()).toEqual({ onHand: ON_HAND - 2, reserved: 0 });
  });

  it("確定を手で pending へ戻して取り消すと、実在庫へ戻す", async () => {
    await setStatus("confirmed");
    await setStatus("pending");
    await setStatus("cancelled");

    expect(stock()).toEqual({ onHand: ON_HAND, reserved: 0 });
  });

  it("pending からいきなり発送済みにしても、引き当てを確定する", async () => {
    await setStatus("shipped");

    expect(stock()).toEqual({ onHand: ON_HAND - 2, reserved: 0 });
  });

  it("発送後に取り消して確定へ戻しても、本数は動かない", async () => {
    await setStatus("confirmed");
    await setStatus("shipped");
    await setStatus("cancelled");
    await setStatus("confirmed");

    expect(stock()).toEqual({ onHand: ON_HAND - 2, reserved: 0 });
  });

  it("発送後に取り消してから全額返金しても、在庫には戻さない", async () => {
    await setStatus("confirmed");
    await setStatus("shipped");
    await setStatus("cancelled");
    await adminRefundOrderAction({ orderId: ORDER_ID });

    expect(stock()).toEqual({ onHand: ON_HAND - 2, reserved: 0 });
  });

  // 品物がどこにあるかは画面の操作からは分からない。増やしすぎると売り越すので、
  // 一度蔵を出た扱いにした注文は自動で足さず、人が数えて足す。
  it("発送済みにしたあと確定へ戻しても、全額返金で在庫へ戻さない", async () => {
    await setStatus("confirmed");
    await setStatus("shipped");
    await setStatus("preparing");
    await adminRefundOrderAction({ orderId: ORDER_ID });

    expect(stock()).toEqual({ onHand: ON_HAND - 2, reserved: 0 });
  });

  it("発送後に取り消して確定へ戻してから全額返金しても、在庫へ戻さない", async () => {
    await setStatus("confirmed");
    await setStatus("shipped");
    await setStatus("cancelled");
    await setStatus("confirmed");
    await adminRefundOrderAction({ orderId: ORDER_ID });

    expect(stock()).toEqual({ onHand: ON_HAND - 2, reserved: 0 });
  });

  it("発送済みから戻したら、在庫が自動で戻らないことを人に知らせる", async () => {
    await setStatus("confirmed");
    await setStatus("shipped");
    alertOps.mockClear();

    await setStatus("preparing");

    expect(alertOps).toHaveBeenCalledTimes(1);
    expect(alertOps.mock.calls[0][1]).toContain("FJ-0001");
    expect(alertOps.mock.calls[0][1]).toContain("/admin/products");
  });

  it("発送後の取り消しや、発送済み同士の変更では知らせない", async () => {
    await setStatus("confirmed");
    await setStatus("shipped");
    alertOps.mockClear();

    await setStatus("delivered");
    await setStatus("cancelled");

    expect(alertOps).not.toHaveBeenCalled();
  });

  it("追跡番号だけの保存では在庫に触らない", async () => {
    sqlite.exec(`
      UPDATE orders SET status = 'confirmed', stock_state = 'none';
      UPDATE inventory SET on_hand = 0, reserved = 0;
    `);

    await expect(
      adminUpdateOrderAction({
        orderId: ORDER_ID,
        status: "confirmed",
        trackingNumber: "1234",
      }),
    ).resolves.toEqual({ ok: true });
  });

  it("売れてしまって足りないときは、取り消した注文を戻さない", async () => {
    await setStatus("confirmed");
    await setStatus("cancelled");
    sqlite.exec("UPDATE inventory SET on_hand = 1");

    await expect(setStatus("confirmed")).resolves.toEqual({
      ok: false,
      error: "stock",
    });
    expect(orderRow()?.status).toBe("cancelled");
    expect(stock()).toEqual({ onHand: 1, reserved: 0 });
  });
});

describe("操作が同時に重なっても本数が合う", () => {
  it("同じ注文を同時に取り消しても、在庫を 1 回しか戻さない", async () => {
    await setStatus("confirmed");

    await Promise.all([setStatus("cancelled"), setStatus("cancelled")]);

    expect(stock()).toEqual({ onHand: ON_HAND, reserved: 0 });
  });

  it("取り消しと全額返金が同時でも、在庫を 1 回しか戻さない", async () => {
    await setStatus("confirmed");

    await Promise.all([
      setStatus("cancelled"),
      adminRefundOrderAction({ orderId: ORDER_ID }),
    ]);
    // 返金は Stripe で成立しているので、記録は遅れても Webhook が揃える。
    await deliver(chargeRefunded(5500));

    expect(stock()).toEqual({ onHand: ON_HAND, reserved: 0 });
    expect(orderRow()?.status).toBe("refunded");
  });

  it("取り消した注文を同時に確定へ戻しても、1 回しか引き落とさない", async () => {
    await setStatus("confirmed");
    await setStatus("cancelled");

    const results = await Promise.all([
      setStatus("confirmed"),
      setStatus("confirmed"),
    ]);

    expect(stock()).toEqual({ onHand: ON_HAND - 2, reserved: 0 });
    expect(results).toContainEqual({ ok: true });
    expect(results).toContainEqual({ ok: false, error: "conflict" });
  });

  it("取り消した注文を戻す途中で先を越されたら、押さえた在庫を放す", async () => {
    await setStatus("confirmed");
    await setStatus("cancelled");
    // 引き当てた直後に、別の操作が注文を動かしたことにする。
    sqlite.exec(`
      CREATE TRIGGER moved_elsewhere AFTER UPDATE OF reserved ON inventory
      BEGIN
        UPDATE orders SET status = 'refunded' WHERE id = '${ORDER_ID}';
      END;
    `);

    await expect(setStatus("confirmed")).resolves.toEqual({
      ok: false,
      error: "conflict",
    });
    expect(stock()).toEqual({ onHand: ON_HAND, reserved: 0 });
    expect(orderRow()?.status).toBe("refunded");
    expect(stockState()).toBe("none");
  });

  it("全額返金の Webhook が同時に届いても、在庫を 1 回しか戻さない", async () => {
    await setStatus("confirmed");

    await Promise.all([
      deliver(chargeRefunded(5500)),
      deliver(chargeRefunded(5500)),
    ]);

    expect(stock()).toEqual({ onHand: ON_HAND, reserved: 0 });
    expect(sendOrderRefundedEmail).toHaveBeenCalledTimes(1);
  });

  it("返金の Webhook が同時に届いても、メールの額の合計は返金額と合う", async () => {
    await setStatus("confirmed");

    const responses = await Promise.all([
      deliver(chargeRefunded(1000)),
      deliver(chargeRefunded(3000)),
    ]);

    expect(responses.map((r) => r.status)).toEqual([200, 200]);
    expect(orderRow()?.refundedAmount).toBe(3000);
    const amounts = sendOrderRefundedEmail.mock.calls.map(
      ([mail]) => (mail as { refundAmount: number }).refundAmount,
    );
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(3000);
  });
});

describe("入金済みで取り消した注文の返金", () => {
  it("管理画面から全額返金でき、在庫は重ねて戻さない", async () => {
    await setStatus("confirmed");
    await setStatus("cancelled");

    const res = await adminRefundOrderAction({ orderId: ORDER_ID });

    expect(res).toEqual({ ok: true, refunded: 5500, remaining: 0 });
    expect(orderRow()?.status).toBe("refunded");
    expect(stock()).toEqual({ onHand: ON_HAND, reserved: 0 });
  });

  it("一部返金ではステータスを変えない", async () => {
    await setStatus("confirmed");
    await setStatus("cancelled");

    const res = await adminRefundOrderAction({
      orderId: ORDER_ID,
      amountJpy: 1000,
    });

    expect(res).toEqual({ ok: true, refunded: 1000, remaining: 4500 });
    expect(orderRow()?.status).toBe("cancelled");
    expect(stock()).toEqual({ onHand: ON_HAND, reserved: 0 });
  });

  it("未入金のまま取り消した注文は返金できない", async () => {
    sqlite.exec("UPDATE orders SET paid_at = NULL");
    await setStatus("cancelled");

    await expect(
      adminRefundOrderAction({ orderId: ORDER_ID }),
    ).resolves.toEqual({ ok: false, error: "not_refundable" });
    expect(refundsCreate).not.toHaveBeenCalled();
  });
});

describe("入金済みで pending へ戻した注文の返金", () => {
  it("管理画面から全額返金でき、在庫へ戻す", async () => {
    await setStatus("confirmed");
    await setStatus("pending");

    await expect(
      adminRefundOrderAction({ orderId: ORDER_ID }),
    ).resolves.toEqual({ ok: true, refunded: 5500, remaining: 0 });
    expect(stock()).toEqual({ onHand: ON_HAND, reserved: 0 });
  });
});

describe("手で pending へ戻した注文の一覧", () => {
  const refsInList = async () => {
    const res = await adminListOrdersAction();
    return res.ok ? res.orders.map((o) => o.orderRef) : [];
  };

  it("入金済みなら管理画面の一覧に残す", async () => {
    await setStatus("confirmed");
    await setStatus("pending");

    await expect(refsInList()).resolves.toEqual(["FJ-0001"]);
  });

  it("引き当て中のまま放棄された注文は出さない", async () => {
    await expect(refsInList()).resolves.toEqual([]);
  });
});

describe("あとから入金された注文", () => {
  const paidLate = {
    type: "checkout.session.async_payment_succeeded",
    data: {
      object: {
        id: "cs_1",
        payment_status: "paid",
        metadata: { orderId: ORDER_ID },
      },
    },
  };

  beforeEach(async () => {
    sqlite.exec(
      "UPDATE orders SET paid_at = NULL, stripe_payment_intent_id = NULL",
    );
    await setStatus("cancelled");
    alertOps.mockClear();
  });

  it("取り消した注文の入金を記録して人に知らせ、返金できるようにする", async () => {
    const res = await deliver(paidLate);

    expect(res.status).toBe(200);
    expect(orderRow()?.status).toBe("cancelled");
    expect(alertOps).toHaveBeenCalledTimes(1);
    expect(alertOps.mock.calls[0][1]).toContain("FJ-0001");
    await expect(
      adminRefundOrderAction({ orderId: ORDER_ID }),
    ).resolves.toEqual({ ok: true, refunded: 5500, remaining: 0 });
    expect(stock()).toEqual({ onHand: ON_HAND, reserved: 0 });
  });

  it("再送では重ねて知らせない", async () => {
    await deliver(paidLate);
    await deliver(paidLate);

    expect(alertOps).toHaveBeenCalledTimes(1);
  });

  it("Stripe で集めたお届け先も残す", async () => {
    sessionsRetrieve.mockResolvedValue({
      payment_intent: "pi_1",
      customer_details: { email: "late@example.com", phone: "09000000000" },
      collected_information: {
        shipping_details: {
          name: "遅れて 払う",
          address: {
            postal_code: "1000001",
            state: "東京都",
            city: "千代田区",
            line1: "千代田1-1",
          },
        },
      },
    });

    await deliver(paidLate);

    const row = sqlite
      .prepare("SELECT customer_name, address, postal_code FROM orders")
      .get();
    expect(row).toEqual(
      expect.objectContaining({
        customer_name: "遅れて 払う",
        address: "東京都千代田区千代田1-1",
        postal_code: "1000001",
      }),
    );
  });

  it("手で確定した未入金の注文への入金も記録する", async () => {
    sqlite.exec("UPDATE orders SET status = 'confirmed', stock_state = 'committed'");

    await deliver(paidLate);

    expect(alertOps).toHaveBeenCalledTimes(1);
    await expect(
      adminRefundOrderAction({ orderId: ORDER_ID }),
    ).resolves.toEqual({ ok: true, refunded: 5500, remaining: 0 });
  });

  it("読んだ直後に注文が消えても、入金を人に知らせる", async () => {
    sessionsRetrieve.mockImplementation(async () => {
      sqlite.exec("DELETE FROM orders");
      return { payment_intent: "pi_1" };
    });

    await deliver(paidLate);

    expect(alertOps).toHaveBeenCalledTimes(1);
    expect(alertOps.mock.calls[0][0]).toContain("注文が見つからない");
  });
});

describe("手で pending へ戻した注文は、未払いの掃除で消さない", () => {
  const sessionExpired = {
    type: "checkout.session.expired",
    data: { object: { id: "cs_1", metadata: { orderId: ORDER_ID } } },
  };

  it("Session の期限切れでは消さず、在庫も動かさない", async () => {
    await setStatus("confirmed");
    await setStatus("pending");

    await deliver(sessionExpired);

    expect(orderRow()?.status).toBe("pending");
    expect(stock()).toEqual({ onHand: ON_HAND - 2, reserved: 0 });
  });

  it("決済ページから戻ったときも消さない", async () => {
    await setStatus("confirmed");
    await setStatus("pending");

    await releaseAbandonedCheckoutAction({ orderRef: "FJ-0001" });

    expect(orderRow()?.status).toBe("pending");
    expect(stock()).toEqual({ onHand: ON_HAND - 2, reserved: 0 });
  });

  it("引き当て中の注文は、これまでどおり消して解放する", async () => {
    await deliver(sessionExpired);

    expect(orderRow()).toBeUndefined();
    expect(stock()).toEqual({ onHand: ON_HAND, reserved: 0 });
  });
});

describe("ゲストが決済ページから戻ったとき", () => {
  beforeEach(() => {
    sessionUser = null;
    sqlite.exec("UPDATE orders SET user_id = NULL, paid_at = NULL");
  });

  it("鍵が合えば、注文を消して在庫を解放する", async () => {
    await expect(
      releaseAbandonedCheckoutAction({
        orderRef: "FJ-0001",
        guestKey: ORDER_ID,
      }),
    ).resolves.toEqual({ ok: true });

    expect(orderRow()).toBeUndefined();
    expect(stock()).toEqual({ onHand: ON_HAND, reserved: 0 });
  });

  // 閉じないと、開いたままの決済ページから消した注文に支払えてしまう。
  it("消す前に Stripe の決済ページを閉じる", async () => {
    await releaseAbandonedCheckoutAction({
      orderRef: "FJ-0001",
      guestKey: ORDER_ID,
    });

    expect(sessionsExpire).toHaveBeenCalledWith("cs_1");
  });

  it("決済ページを閉じられなければ、注文も在庫も残す", async () => {
    sessionsExpire.mockRejectedValue(new Error("session is already complete"));
    sessionsRetrieve.mockResolvedValue({ status: "complete" });

    await expect(
      releaseAbandonedCheckoutAction({
        orderRef: "FJ-0001",
        guestKey: ORDER_ID,
      }),
    ).resolves.toEqual({ ok: false });

    expect(orderRow()?.status).toBe("pending");
    expect(stock().reserved).toBe(2);
  });

  it("Session の id が無ければ、閉じられないので消さない", async () => {
    sqlite.exec("UPDATE orders SET stripe_session_id = NULL");

    await expect(
      releaseAbandonedCheckoutAction({
        orderRef: "FJ-0001",
        guestKey: ORDER_ID,
      }),
    ).resolves.toEqual({ ok: false });

    expect(orderRow()?.status).toBe("pending");
    expect(stock().reserved).toBe(2);
  });

  // 期限切れの Webhook の処理に失敗した注文。閉じられないのは期限が切れているからで、
  // 支払いは進まないので消してよい。消せないと引き当てが残り続ける。
  it("決済ページが期限切れで閉じられないなら、消して在庫を解放する", async () => {
    sessionsExpire.mockRejectedValue(new Error("session is not open"));
    sessionsRetrieve.mockResolvedValue({ status: "expired" });

    await expect(
      releaseAbandonedCheckoutAction({
        orderRef: "FJ-0001",
        guestKey: ORDER_ID,
      }),
    ).resolves.toEqual({ ok: true });

    expect(orderRow()).toBeUndefined();
    expect(stock()).toEqual({ onHand: ON_HAND, reserved: 0 });
  });

  it("鍵が違えば、決済ページも閉じない", async () => {
    await releaseAbandonedCheckoutAction({
      orderRef: "FJ-0001",
      guestKey: "wrong",
    });

    expect(sessionsExpire).not.toHaveBeenCalled();
  });

  it("鍵が違えば、何もしない", async () => {
    await expect(
      releaseAbandonedCheckoutAction({
        orderRef: "FJ-0001",
        guestKey: "wrong",
      }),
    ).resolves.toEqual({ ok: false });

    expect(orderRow()?.status).toBe("pending");
    expect(stock().reserved).toBe(2);
  });

  it("注文番号だけでは解放できない", async () => {
    await expect(
      releaseAbandonedCheckoutAction({ orderRef: "FJ-0001" }),
    ).resolves.toEqual({ ok: false });

    expect(orderRow()?.status).toBe("pending");
  });

  it("鍵が合っても、会員の注文は解放できない", async () => {
    sqlite.exec("UPDATE orders SET user_id = 'u_1'");

    await expect(
      releaseAbandonedCheckoutAction({
        orderRef: "FJ-0001",
        guestKey: ORDER_ID,
      }),
    ).resolves.toEqual({ ok: false });

    expect(orderRow()?.status).toBe("pending");
  });
});
