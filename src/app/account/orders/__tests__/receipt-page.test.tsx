/**
 * @jest-environment jsdom
 */

// 領収書は Stripe が出す。自前では書面を組まず、開くたびに最新のリンクへ転送する。
// リンクは 30 日で切れるので、保存したものを見せると古い注文で開けなくなる。

jest.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("notFound");
  },
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
const getSession = jest.fn();
jest.mock("@/lib/session", () => ({
  getSession: () => getSession(),
}));
const getMyOrderReceiptUrlAction = jest.fn();
jest.mock("@/lib/actions/orders", () => ({
  getMyOrderReceiptUrlAction: (...a: unknown[]) =>
    getMyOrderReceiptUrlAction(...a),
}));

import ReceiptPage from "@/app/account/orders/[orderRef]/receipt/page";

const open = () =>
  ReceiptPage({ params: Promise.resolve({ orderRef: "FJ-0001" }) });

beforeEach(() => {
  jest.clearAllMocks();
  getSession.mockResolvedValue({ user: { id: "u_1" } });
});

describe("領収書の表示", () => {
  it("Stripe の領収書へ転送する", async () => {
    getMyOrderReceiptUrlAction.mockResolvedValue(
      "https://pay.stripe.com/receipts/payment/abc",
    );
    await expect(open()).rejects.toThrow(
      "redirect:https://pay.stripe.com/receipts/payment/abc",
    );
    expect(getMyOrderReceiptUrlAction).toHaveBeenCalledWith("FJ-0001");
  });

  it("領収書が無い注文は 404 にする", async () => {
    getMyOrderReceiptUrlAction.mockResolvedValue(null);
    await expect(open()).rejects.toThrow("notFound");
  });

  it("未ログインならログインへ送り、戻り先を付ける", async () => {
    getSession.mockResolvedValue(null);
    await expect(open()).rejects.toThrow(
      `redirect:/login/personal?redirect=${encodeURIComponent("/account/orders/FJ-0001/receipt")}`,
    );
    expect(getMyOrderReceiptUrlAction).not.toHaveBeenCalled();
  });
});
