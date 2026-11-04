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
jest.mock("@/lib/ops-alert", () => ({ alertOps: jest.fn() }));
jest.mock("@/lib/inventory", () => ({
  commitStock: jest.fn(),
  releaseStock: jest.fn(),
  restockCommitted: jest.fn(),
}));

let row: Record<string, unknown>;
jest.mock("@/db", () => ({
  getDb: async () => ({
    select: () => ({
      from: () => ({ where: () => ({ limit: async () => [row] }) }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({ returning: async () => [{ id: row.id }] }),
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

beforeEach(() => jest.clearAllMocks());

describe("adminRefundOrderAction", () => {
  it("退会済みのお客様の注文も返金でき、メールには退会済みであることを渡す", async () => {
    row = { ...ORDER, userId: null };

    expect(await adminRefundOrderAction({ orderId: "o_1" })).toMatchObject({
      ok: true,
    });
    expect(sendOrderRefundedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ accountDeleted: true }),
    );
  });

  it("会員の注文では退会済みとして扱わない", async () => {
    row = { ...ORDER, userId: "u_1" };

    await adminRefundOrderAction({ orderId: "o_1" });

    expect(sendOrderRefundedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ accountDeleted: false }),
    );
  });
});
