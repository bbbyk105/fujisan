/**
 * @jest-environment node
 */

// 管理画面から手でステータスを動かしたときの在庫の辻褄合わせ。
// Webhook の自動経路だけを見ていると、手動操作の分がそのままずれる。

const getSession = jest.fn();
jest.mock("@/lib/auth", () => ({
  getAuth: async () => ({ api: { getSession } }),
}));
jest.mock("next/headers", () => ({ headers: async () => new Headers() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

jest.mock("@/lib/admin", () => ({
  getEffectiveAdminRole: async () => "owner",
  isStaffOrAbove: (r: unknown) => r === "owner" || r === "staff",
  isOwner: (r: unknown) => r === "owner",
}));

let orderRow: Record<string, unknown> | undefined;
jest.mock("@/db", () => ({
  getDb: async () => ({
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => (orderRow ? [orderRow] : []) }),
      }),
    }),
    update: () => ({
      set: () => ({ where: async () => undefined }),
    }),
  }),
}));

const commitStock = jest.fn();
const releaseStock = jest.fn();
const restockCommitted = jest.fn();
jest.mock("@/lib/inventory", () => ({
  commitStock: (...a: unknown[]) => commitStock(...a),
  releaseStock: (...a: unknown[]) => releaseStock(...a),
  restockCommitted: (...a: unknown[]) => restockCommitted(...a),
}));

jest.mock("@/lib/emails/order-emails", () => ({
  sendOrderShippedEmail: jest.fn(),
  sendOrderDeliveredEmail: jest.fn(),
  sendOrderRefundedEmail: jest.fn(),
}));

jest.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: async () => ({ env: {} }),
}));
jest.mock("@/lib/stripe", () => ({ getStripe: () => ({}) }));

import { adminUpdateOrderAction } from "@/lib/actions/admin-orders";

const ITEMS = JSON.stringify([
  {
    slug: "shogun",
    name: "FUJISAN",
    variant: "SHOGUN",
    ml: 300,
    qty: 2,
    unitPrice: 2750,
    lineTotal: 5500,
  },
]);

function row(status: string) {
  return {
    id: "order_1",
    orderRef: "FJ-ABC123",
    status,
    itemsJson: ITEMS,
    itemsCount: 2,
    subtotal: 5500,
    shipping: 1100,
    total: 6600,
    customerName: "佐藤 優子",
    customerEmail: "sato@example.com",
    postalCode: "1000001",
    address: "東京都千代田区千代田1-1",
    shippedAt: null,
    deliveredAt: null,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  getSession.mockResolvedValue({
    user: { id: "admin_1", email: "owner@example.com" },
  });
});

describe("adminUpdateOrderAction — 手動ステータス変更と在庫", () => {
  it("pending → confirmed で在庫を確定する（手で入金確認したとき）", async () => {
    orderRow = row("pending");
    const res = await adminUpdateOrderAction({
      orderId: "order_1",
      status: "confirmed",
    });

    expect(res).toEqual({ ok: true });
    expect(commitStock).toHaveBeenCalledTimes(1);
    expect(commitStock.mock.calls[0][0]).toEqual([
      expect.objectContaining({ slug: "shogun", qty: 2 }),
    ]);
  });

  it("pending → cancelled は引き当てを解放するだけ（実在庫は減っていない）", async () => {
    orderRow = row("pending");
    await adminUpdateOrderAction({ orderId: "order_1", status: "cancelled" });

    expect(releaseStock).toHaveBeenCalledTimes(1);
    expect(restockCommitted).not.toHaveBeenCalled();
  });

  it("confirmed → cancelled は実在庫に戻す（入金済みだが未発送）", async () => {
    orderRow = row("confirmed");
    await adminUpdateOrderAction({ orderId: "order_1", status: "cancelled" });

    expect(restockCommitted).toHaveBeenCalledTimes(1);
    expect(releaseStock).not.toHaveBeenCalled();
  });

  it("preparing → cancelled も実在庫に戻す", async () => {
    orderRow = row("preparing");
    await adminUpdateOrderAction({ orderId: "order_1", status: "cancelled" });
    expect(restockCommitted).toHaveBeenCalledTimes(1);
  });

  it("発送後の取消では在庫に戻さない（品物が手元に無い）", async () => {
    for (const status of ["shipped", "delivered"]) {
      jest.clearAllMocks();
      orderRow = row(status);
      await adminUpdateOrderAction({ orderId: "order_1", status: "cancelled" });

      expect(restockCommitted).not.toHaveBeenCalled();
      expect(releaseStock).not.toHaveBeenCalled();
    }
  });

  it("同じステータスへの保存では在庫を動かさない", async () => {
    orderRow = row("confirmed");
    await adminUpdateOrderAction({ orderId: "order_1", status: "confirmed" });

    expect(commitStock).not.toHaveBeenCalled();
    expect(restockCommitted).not.toHaveBeenCalled();
    expect(releaseStock).not.toHaveBeenCalled();
  });

  it("confirmed → shipped のような通常の進行では在庫を動かさない", async () => {
    orderRow = row("confirmed");
    await adminUpdateOrderAction({ orderId: "order_1", status: "shipped" });

    expect(commitStock).not.toHaveBeenCalled();
    expect(restockCommitted).not.toHaveBeenCalled();
  });

  it("在庫の調整に失敗しても管理操作自体は成功させる", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    restockCommitted.mockRejectedValue(new Error("d1 unavailable"));
    orderRow = row("confirmed");

    const res = await adminUpdateOrderAction({
      orderId: "order_1",
      status: "cancelled",
    });
    errSpy.mockRestore();

    expect(res).toEqual({ ok: true });
  });
});
