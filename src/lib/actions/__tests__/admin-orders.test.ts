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
/** update().returning() が返す行。空にすると「別の操作に先を越された」状態になる。 */
let updatedRows: Array<{ id: string }> = [{ id: "order_1" }];
let updateShouldThrow = false;
jest.mock("@/db", () => ({
  getDb: async () => ({
    select: () => ({
      from: () => ({
        where: () => ({ limit: async () => (orderRow ? [orderRow] : []) }),
      }),
    }),
    update: () => ({
      set: () => ({
        where: () => ({
          returning: async () => {
            if (updateShouldThrow) throw new Error("d1 unavailable");
            return updatedRows;
          },
        }),
      }),
    }),
  }),
}));

const alertOps = jest.fn();
jest.mock("@/lib/ops-alert", () => ({
  alertOps: (...a: unknown[]) => alertOps(...a),
}));

const commitStock = jest.fn();
const releaseStock = jest.fn();
const restockCommitted = jest.fn();
const reserveStock = jest.fn();
jest.mock("@/lib/inventory", () => ({
  commitStock: (...a: unknown[]) => commitStock(...a),
  releaseStock: (...a: unknown[]) => releaseStock(...a),
  restockCommitted: (...a: unknown[]) => restockCommitted(...a),
  reserveStock: (...a: unknown[]) => reserveStock(...a),
  formatStockWarnings: () => null,
}));

const sendOrderShippedEmail = jest.fn();
jest.mock("@/lib/emails/order-emails", () => ({
  sendOrderShippedEmail: (...a: unknown[]) => sendOrderShippedEmail(...a),
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

/** 手で動かしていない注文の、ステータスごとの在庫の状態。 */
const STOCK_STATE_OF: Record<string, string> = {
  pending: "reserved",
  confirmed: "committed",
  preparing: "committed",
  shipped: "shipped",
  delivered: "shipped",
  cancelled: "none",
  refunded: "none",
};

function row(status: string) {
  return {
    id: "order_1",
    orderRef: "FJ-ABC123",
    status,
    stockState: STOCK_STATE_OF[status],
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
  updatedRows = [{ id: "order_1" }];
  updateShouldThrow = false;
  // clearAllMocks は実装を消さないので、失敗させた実装が後のテストへ漏れないよう戻す。
  restockCommitted.mockReset();
  reserveStock.mockResolvedValue({ ok: true });
  commitStock.mockResolvedValue([]);
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

  // 全額返金で在庫は戻してある。ここで動かすと二重に戻り、発送の一覧へ戻ることもある。
  it.each(["cancelled", "confirmed", "preparing", "shipped"] as const)(
    "返金済みの注文は %s に変えられず、在庫も動かない",
    async (status) => {
      orderRow = row("refunded");

      expect(
        await adminUpdateOrderAction({ orderId: "order_1", status }),
      ).toEqual({ ok: false, error: "refunded" });
      expect(restockCommitted).not.toHaveBeenCalled();
    },
  );

  // 返金の操作を通さずに返金済みにすると、お金を返していないのに在庫だけが戻る。
  it("返金の操作を通さずに返金済みへは変えられない", async () => {
    orderRow = row("confirmed");

    expect(
      await adminUpdateOrderAction({ orderId: "order_1", status: "refunded" }),
    ).toEqual({ ok: false, error: "refunded" });
    expect(restockCommitted).not.toHaveBeenCalled();
  });

  it("返金済みのまま追跡番号だけを保存することはできる", async () => {
    orderRow = row("refunded");

    expect(
      await adminUpdateOrderAction({
        orderId: "order_1",
        status: "refunded",
        trackingNumber: "1234",
      }),
    ).toEqual({ ok: true });
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

  it("在庫の調整に失敗しても管理操作自体は成功させ、人に知らせる", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    restockCommitted.mockRejectedValue(new Error("d1 unavailable"));
    orderRow = row("confirmed");

    const res = await adminUpdateOrderAction({
      orderId: "order_1",
      status: "cancelled",
    });
    errSpy.mockRestore();

    expect(res).toEqual({ ok: true });
    expect(alertOps).toHaveBeenCalledTimes(1);
    expect(alertOps.mock.calls[0][1]).toContain("FJ-ABC123");
  });
});

describe("adminUpdateOrderAction — 発送メールの案内先", () => {
  it("アカウントが無い注文は noAccount を渡す", async () => {
    orderRow = { ...row("confirmed"), userId: null };
    await adminUpdateOrderAction({ orderId: "order_1", status: "shipped" });

    expect(sendOrderShippedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ noAccount: true }),
    );
  });

  it("会員の注文には渡さない", async () => {
    orderRow = { ...row("confirmed"), userId: "u_1" };
    await adminUpdateOrderAction({ orderId: "order_1", status: "shipped" });

    expect(sendOrderShippedEmail).toHaveBeenCalledWith(
      expect.objectContaining({ noAccount: false }),
    );
  });
});

describe("adminUpdateOrderAction — 発送メールの失敗", () => {
  it("アカウントが無い注文で失敗したら、追跡番号が届かないことを人に知らせる", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    sendOrderShippedEmail.mockRejectedValueOnce(new Error("resend down"));
    orderRow = { ...row("confirmed"), userId: null };

    const res = await adminUpdateOrderAction({
      orderId: "order_1",
      status: "shipped",
    });
    errSpy.mockRestore();

    expect(res).toEqual({ ok: true });
    expect(alertOps).toHaveBeenCalledTimes(1);
    expect(alertOps.mock.calls[0][1]).toContain("FJ-ABC123");
  });
});

describe("adminUpdateOrderAction — ほかの操作との重なり", () => {
  it("読んだあとにステータスが動いていたら保存せず、在庫も動かさない", async () => {
    orderRow = row("confirmed");
    updatedRows = [];

    expect(
      await adminUpdateOrderAction({ orderId: "order_1", status: "cancelled" }),
    ).toEqual({ ok: false, error: "conflict" });
    expect(restockCommitted).not.toHaveBeenCalled();
  });

  it("取り消した注文を戻す更新が失敗したら、押さえた在庫を放す", async () => {
    orderRow = row("cancelled");
    updateShouldThrow = true;

    expect(
      await adminUpdateOrderAction({ orderId: "order_1", status: "confirmed" }),
    ).toEqual({ ok: false, error: "db" });
    expect(releaseStock).toHaveBeenCalledTimes(1);
  });

  it("開いた画面より新しい状態なら、古い画面の内容で上書きしない", async () => {
    orderRow = row("cancelled");

    expect(
      await adminUpdateOrderAction({
        orderId: "order_1",
        status: "confirmed",
        expectedStatus: "confirmed",
      }),
    ).toEqual({ ok: false, error: "conflict" });
    expect(reserveStock).not.toHaveBeenCalled();
  });
});
