/**
 * @jest-environment node
 */

// 管理画面の返金ボタンの経路。退会済みのお客様の注文も返金でき、そのときは
// もうログインできない /account へ案内しない。

jest.mock("next/headers", () => ({ headers: async () => new Headers() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env: { STRIPE_SECRET_KEY: "sk_test_1" } }),
}));
jest.mock("@/lib/auth", () => ({
  getAuth: async () => ({
    api: {
      getSession: async () => ({
        user: { id: "owner_1", email: "owner@example.com" },
      }),
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
const restockCommitted = jest.fn();
jest.mock("@/lib/inventory", () => ({
  commitStock: jest.fn(),
  releaseStock: jest.fn(),
  restockCommitted: (...a: unknown[]) => restockCommitted(...a),
}));

let row: Record<string, unknown>;
let updatedRows: Array<{ id: unknown }> | null = null;
jest.mock("@/db", () => ({
  getDb: async () => ({
    select: () => ({
      from: () => ({ where: () => ({ limit: async () => [row] }) }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => updatedRows ?? [{ id: row.id }],
        }),
      }),
    }),
  }),
}));

jest.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    checkout: {
      sessions: { retrieve: async () => ({ payment_intent: "pi_1" }) },
    },
    refunds: { create: async () => ({ id: "re_1" }) },
  }),
}));

const sendOrderRefundedEmail = jest.fn();
jest.mock("@/lib/emails/order-emails", () => ({
  sendOrderRefundedEmail: (...a: unknown[]) => sendOrderRefundedEmail(...a),
  sendOrderShippedEmail: jest.fn(),
  sendOrderDeliveredEmail: jest.fn(),
  sendOrderConfirmedEmail: jest.fn(),
}));

import { adminRefundOrderAction } from "@/lib/actions/admin-orders";

const ORDER = {
  id: "o_1",
  orderRef: "FJ-0001",
  status: "delivered",
  stockState: "shipped",
  paidAt: new Date(1000),
  stripeSessionId: "cs_1",
  stripePaymentIntentId: "pi_1",
  itemsJson: "[]",
  itemsCount: 1,
  subtotal: 2750,
  shipping: 1100,
  total: 3850,
  refundedAmount: null,
  customerName: "山田 太郎",
  customerEmail: "taro@example.com",
  postalCode: "4170051",
  address: "静岡県富士市吉原",
};

beforeEach(() => {
  jest.clearAllMocks();
  // clearAllMocks は実装を消さないので、失敗させた実装が後のテストへ漏れないよう戻す。
  restockCommitted.mockReset();
  updatedRows = null;
});

describe("adminRefundOrderAction", () => {
  it("退会済みのお客様の注文も返金でき、メールには退会済みであることを渡す", async () => {
    row = { ...ORDER, userId: null };

    expect(await adminRefundOrderAction({ orderId: "o_1" })).toMatchObject({
      ok: true,
    });
    expect(sendOrderRefundedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ noAccount: true }),
    );
  });

  it("発送済みの注文の一部返金は、メールに発送済みであることを渡す", async () => {
    row = { ...ORDER, userId: "u_1", status: "delivered" };

    await adminRefundOrderAction({ orderId: "o_1", amountJpy: 1100 });

    expect(sendOrderRefundedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ partial: true, stillShipping: false }),
    );
  });

  it("発送前の注文の一部返金は、発送済みとして扱わない", async () => {
    row = { ...ORDER, userId: "u_1", status: "preparing" };

    await adminRefundOrderAction({ orderId: "o_1", amountJpy: 1100 });

    expect(sendOrderRefundedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ partial: true, stillShipping: true }),
    );
  });

  // Webhook が先に反映すると、こちらの UPDATE は 0 行になる。残額を 0 と返すと、
  // 一部返金なのに画面に「全額を返金しました」と出て、次の判断を誤らせる。
  describe("Webhook が先に反映していたとき", () => {
    it("一部返金なら、残額をそのまま返す", async () => {
      row = { ...ORDER, userId: "u_1", status: "preparing" };
      updatedRows = [];

      expect(
        await adminRefundOrderAction({ orderId: "o_1", amountJpy: 1100 }),
      ).toEqual({ ok: true, refunded: 1100, remaining: 2750 });
    });

    it("全額返金なら、残額は 0 を返す", async () => {
      row = { ...ORDER, userId: "u_1", status: "preparing" };
      updatedRows = [];

      expect(await adminRefundOrderAction({ orderId: "o_1" })).toEqual({
        ok: true,
        refunded: 3850,
        remaining: 0,
      });
    });

    it("メールは重ねて送らない", async () => {
      row = { ...ORDER, userId: "u_1", status: "preparing" };
      updatedRows = [];

      await adminRefundOrderAction({ orderId: "o_1", amountJpy: 1100 });

      expect(sendOrderRefundedEmail).not.toHaveBeenCalled();
    });

    it("在庫は重ねて戻さない", async () => {
      row = { ...ORDER, userId: "u_1", status: "preparing" };
      updatedRows = [];

      await adminRefundOrderAction({ orderId: "o_1" });

      expect(restockCommitted).not.toHaveBeenCalled();
    });
  });

  it("全額返金の在庫の戻しに失敗しても返金は成功させ、人に知らせる", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    restockCommitted.mockRejectedValue(new Error("d1 unavailable"));
    row = { ...ORDER, userId: "u_1", status: "preparing", stockState: "committed" };

    const res = await adminRefundOrderAction({ orderId: "o_1" });
    errSpy.mockRestore();

    expect(res).toEqual({ ok: true, refunded: 3850, remaining: 0 });
    expect(alertOps).toHaveBeenCalledTimes(1);
    expect(alertOps.mock.calls[0][1]).toContain("FJ-0001");
  });

  it("会員の注文では退会済みとして扱わない", async () => {
    row = { ...ORDER, userId: "u_1" };

    await adminRefundOrderAction({ orderId: "o_1" });

    expect(sendOrderRefundedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ noAccount: false }),
    );
  });
});
