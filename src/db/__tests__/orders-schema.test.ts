import { ORDER_STATUSES, isReceiptIssuable } from "@/db/orders-schema";

describe("isReceiptIssuable", () => {
  it("代金を受け取って保持している間は発行できる", () => {
    for (const status of ["confirmed", "preparing", "shipped", "delivered"] as const) {
      expect(isReceiptIssuable(status)).toBe(true);
    }
  });

  it("未入金・キャンセル・返金済みには発行しない", () => {
    // 返金済みに「上記正に領収いたしました」を出すと事実と食い違う。
    expect(isReceiptIssuable("refunded")).toBe(false);
    expect(isReceiptIssuable("cancelled")).toBe(false);
    expect(isReceiptIssuable("pending")).toBe(false);
  });

  it("全ステータスを判定できる（新ステータス追加時の取りこぼし防止）", () => {
    for (const status of ORDER_STATUSES) {
      expect(typeof isReceiptIssuable(status)).toBe("boolean");
    }
  });
});
