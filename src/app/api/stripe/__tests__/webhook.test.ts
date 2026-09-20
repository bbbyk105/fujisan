/**
 * @jest-environment node
 */

// ── 依存のモック ───────────────────────────────────────────────
// Webhook は「入金の確定」を担うので、ここで守りたいのは次の 3 点。
//   1. 冪等性: 同じ配信が 2 回来ても二重確定・二重メールにならない
//   2. 住所の書き戻し: Stripe 収集分を反映しつつ、登録住所を空で潰さない
//   3. 失敗時の扱い: DB 失敗だけ 500（Stripe に再送させる）、メール失敗は 200

const env: Record<string, string | undefined> = {
  STRIPE_SECRET_KEY: "sk_test_123",
  STRIPE_WEBHOOK_SECRET: "whsec_test",
};
jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env }),
}));

const sessionsRetrieve = jest.fn();
const verifyStripeSignature = jest.fn();
jest.mock("@/lib/stripe", () => ({
  getStripe: () => ({ checkout: { sessions: { retrieve: sessionsRetrieve } } }),
  verifyStripeSignature: (...args: unknown[]) => verifyStripeSignature(...args),
}));

/** DB スタブ。select が返す注文行と、update の結果行数を差し替えられるようにする。 */
let orderRow: Record<string, unknown> | undefined;
let updateReturns: Array<{ id: string }> = [];
let updateShouldThrow = false;
const updateCalls: Array<Record<string, unknown>> = [];

jest.mock("@/db", () => ({
  getDb: async () => ({
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => (orderRow ? [orderRow] : []) }),
      }),
    }),
    update: () => ({
      set: (values: Record<string, unknown>) => {
        updateCalls.push(values);
        return {
          where: () => ({
            returning: async () => {
              if (updateShouldThrow) throw new Error("d1 unavailable");
              return updateReturns;
            },
          }),
        };
      },
    }),
  }),
}));

const sendOrderConfirmedEmail = jest.fn();
jest.mock("@/lib/emails/order-emails", () => ({
  sendOrderConfirmedEmail: (...args: unknown[]) =>
    sendOrderConfirmedEmail(...args),
}));

const alertOps = jest.fn();
jest.mock("@/lib/ops-alert", () => ({
  alertOps: (...args: unknown[]) => alertOps(...args),
}));

import { POST } from "@/app/api/stripe/webhook/route";

const ORDER_ID = "order_1";

function baseOrderRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ORDER_ID,
    orderRef: "FJ-ABC123",
    status: "pending",
    itemsJson: JSON.stringify([
      {
        slug: "shogun",
        name: "FUJISAN",
        variant: "SHOGUN",
        ml: 300,
        qty: 1,
        unitPrice: 2750,
        lineTotal: 2750,
      },
    ]),
    itemsCount: 1,
    subtotal: 2750,
    shipping: 1100,
    total: 3850,
    customerName: "",
    customerEmail: "",
    postalCode: "",
    address: "",
    phone: "",
    ...overrides,
  };
}

/** Stripe が収集した情報を持つ完全な Session。 */
function fullSession(overrides: Record<string, unknown> = {}) {
  return {
    id: "cs_test_1",
    payment_intent: "pi_test_1",
    collected_information: {
      shipping_details: {
        name: "佐藤 優子",
        address: {
          postal_code: "1000001",
          state: "東京都",
          city: "千代田区",
          line1: "千代田1-1",
          line2: "富士ビル 5F",
        },
      },
    },
    customer_details: {
      name: "佐藤 優子",
      email: "sato@example.com",
      phone: "09012345678",
    },
    ...overrides,
  };
}

function postWebhook() {
  return POST(
    new Request("https://example.com/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=abc" },
      body: "{}",
    }),
  );
}

/** 署名検証を通り、指定イベントを返すようにする。 */
function givenEvent(
  type: string,
  session: Record<string, unknown> = { id: "cs_test_1", payment_status: "paid" },
) {
  verifyStripeSignature.mockResolvedValue({
    type,
    data: { object: { metadata: { orderId: ORDER_ID }, ...session } },
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  updateCalls.length = 0;
  updateReturns = [{ id: ORDER_ID }];
  updateShouldThrow = false;
  orderRow = baseOrderRow();
  env.STRIPE_SECRET_KEY = "sk_test_123";
  env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  sessionsRetrieve.mockResolvedValue(fullSession());
});

describe("Stripe Webhook — 入口のガード", () => {
  it("Stripe 未設定なら 500", async () => {
    env.STRIPE_WEBHOOK_SECRET = undefined;
    expect((await postWebhook()).status).toBe(500);
  });

  it("署名ヘッダーが無ければ 400", async () => {
    const res = await POST(
      new Request("https://example.com/api/stripe/webhook", {
        method: "POST",
        body: "{}",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("署名検証に失敗したら 400（本文は処理しない）", async () => {
    verifyStripeSignature.mockRejectedValue(new Error("bad signature"));
    const res = await postWebhook();
    expect(res.status).toBe(400);
    expect(updateCalls).toHaveLength(0);
  });

  it("署名検証には生ボディをそのまま渡す（JSON パースしない）", async () => {
    givenEvent("checkout.session.completed");
    await POST(
      new Request("https://example.com/api/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "t=1,v1=abc" },
        body: '{"raw":"body"}',
      }),
    );
    expect(verifyStripeSignature).toHaveBeenCalledWith(
      expect.anything(),
      '{"raw":"body"}',
      "t=1,v1=abc",
      "whsec_test",
    );
  });
});

describe("Stripe Webhook — 注文確定", () => {
  it("checkout.session.completed で pending を confirmed にし、確定メールを送る", async () => {
    givenEvent("checkout.session.completed");
    const res = await postWebhook();

    expect(res.status).toBe(200);
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0]).toMatchObject({
      status: "confirmed",
      stripeSessionId: "cs_test_1",
      stripePaymentIntentId: "pi_test_1",
    });
    expect(updateCalls[0].paidAt).toBeInstanceOf(Date);
    expect(sendOrderConfirmedEmail).toHaveBeenCalledTimes(1);
  });

  it("コンビニ等の後追い入金（async_payment_succeeded）も確定する", async () => {
    givenEvent("checkout.session.async_payment_succeeded");
    const res = await postWebhook();
    expect(res.status).toBe(200);
    expect(updateCalls[0]).toMatchObject({ status: "confirmed" });
    expect(sendOrderConfirmedEmail).toHaveBeenCalledTimes(1);
  });

  it("未払い（payment_status !== paid）では確定もメールもしない", async () => {
    givenEvent("checkout.session.completed", {
      id: "cs_test_1",
      payment_status: "unpaid",
    });
    const res = await postWebhook();
    expect(res.status).toBe(200);
    expect(updateCalls).toHaveLength(0);
    expect(sendOrderConfirmedEmail).not.toHaveBeenCalled();
  });

  it("当方が発行していないセッション（metadata 無し）は無視する", async () => {
    verifyStripeSignature.mockResolvedValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_other", payment_status: "paid" } },
    });
    const res = await postWebhook();
    expect(res.status).toBe(200);
    expect(updateCalls).toHaveLength(0);
  });

  it("扱わないイベント種別は素通しする", async () => {
    givenEvent("payment_intent.created");
    const res = await postWebhook();
    expect(res.status).toBe(200);
    expect(updateCalls).toHaveLength(0);
    expect(sendOrderConfirmedEmail).not.toHaveBeenCalled();
  });
});

describe("Stripe Webhook — 冪等性", () => {
  it("同じ配信が再送されても、2 回目は確定もメールもしない", async () => {
    givenEvent("checkout.session.completed");

    // 1 回目: pending → confirmed に更新できる
    updateReturns = [{ id: ORDER_ID }];
    await postWebhook();
    expect(sendOrderConfirmedEmail).toHaveBeenCalledTimes(1);

    // 2 回目: WHERE status='pending' に合致せず更新行ゼロ
    updateReturns = [];
    const res = await postWebhook();
    expect(res.status).toBe(200);
    expect(sendOrderConfirmedEmail).toHaveBeenCalledTimes(1);
  });

  it("注文が見つからない場合は受領のみで終える", async () => {
    orderRow = undefined;
    givenEvent("checkout.session.completed");
    const res = await postWebhook();
    expect(res.status).toBe(200);
    expect(updateCalls).toHaveLength(0);
    expect(sendOrderConfirmedEmail).not.toHaveBeenCalled();
  });
});

describe("Stripe Webhook — お届け先の書き戻し", () => {
  it("Stripe が収集した住所を日本語1行に整形して保存する", async () => {
    givenEvent("checkout.session.completed");
    await postWebhook();

    expect(updateCalls[0]).toMatchObject({
      customerName: "佐藤 優子",
      customerEmail: "sato@example.com",
      phone: "09012345678",
      postalCode: "1000001",
      address: "東京都千代田区千代田1-1 富士ビル 5F",
    });
  });

  it("登録住所で注文した場合（Stripe は住所を収集しない）、既存値を空で潰さない", async () => {
    orderRow = baseOrderRow({
      customerName: "近藤 弘人",
      customerEmail: "kondo@example.com",
      postalCode: "4170051",
      address: "静岡県富士市吉原2-8-21",
      phone: "07093234144",
    });
    // 住所収集していないので shipping_details も customer_details も無い
    sessionsRetrieve.mockResolvedValue({
      id: "cs_test_1",
      payment_intent: "pi_test_1",
      collected_information: null,
      customer_details: null,
    });

    givenEvent("checkout.session.completed");
    await postWebhook();

    expect(updateCalls[0]).toMatchObject({
      customerName: "近藤 弘人",
      customerEmail: "kondo@example.com",
      postalCode: "4170051",
      address: "静岡県富士市吉原2-8-21",
      phone: "07093234144",
    });
  });

  it("payment_intent がオブジェクトで返ってきても id を取り出す", async () => {
    sessionsRetrieve.mockResolvedValue(
      fullSession({ payment_intent: { id: "pi_object_1" } }),
    );
    givenEvent("checkout.session.completed");
    await postWebhook();
    expect(updateCalls[0].stripePaymentIntentId).toBe("pi_object_1");
  });
});

describe("Stripe Webhook — 失敗時の扱い", () => {
  it("メール送信が落ちても 200 を返す（再送させるとメールが二度と飛ばない）", async () => {
    // 失敗はログに出す設計なので、テスト出力を汚さないよう握りつぶす
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    sendOrderConfirmedEmail.mockRejectedValue(new Error("resend down"));
    givenEvent("checkout.session.completed");

    const res = await postWebhook();
    errSpy.mockRestore();

    expect(res.status).toBe(200);
    // 注文の確定自体は済んでいる
    expect(updateCalls[0]).toMatchObject({ status: "confirmed" });
  });

  it("DB 確定に失敗したら 500 を返し、管理者へアラートを出す", async () => {
    updateShouldThrow = true;
    givenEvent("checkout.session.completed");

    const res = await postWebhook();

    expect(res.status).toBe(500);
    expect(alertOps).toHaveBeenCalledTimes(1);
    expect(sendOrderConfirmedEmail).not.toHaveBeenCalled();
  });
});
