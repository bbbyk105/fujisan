import {
  ORDER_STATUSES,
  canRestock,
  isReceiptIssuable,
  willStillShip,
} from "@/db/orders-schema";

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

// 一部返金のあとの案内に使う。「蔵を出ていない」と「これから発送する」は別で、
// 取り消した注文や、キャンセルを依頼された注文は蔵にあっても発送しない。
describe("willStillShip", () => {
  it.each(["confirmed", "preparing"] as const)("%s はこのまま発送する", (status) => {
    expect(willStillShip({ status, cancelRequestedAt: null })).toBe(true);
  });

  it.each(["shipped", "delivered"] as const)("%s はもう発送しない", (status) => {
    expect(willStillShip({ status, cancelRequestedAt: null })).toBe(false);
  });

  it.each(["pending", "cancelled", "refunded"] as const)(
    "%s は発送しない",
    (status) => {
      expect(willStillShip({ status, cancelRequestedAt: null })).toBe(false);
    },
  );

  it("キャンセルを依頼された注文は、発送前でも発送すると言わない", () => {
    expect(
      willStillShip({ status: "confirmed", cancelRequestedAt: new Date() }),
    ).toBe(false);
  });
});

// 引き落とした在庫を戻してよい注文か。蔵を出た注文には品物が無く、
// 取り消し・返金済みの注文はもう戻してある。
describe("canRestock", () => {
  it.each(["pending", "confirmed", "preparing"] as const)(
    "%s は戻してよい",
    (status) => {
      expect(canRestock(status)).toBe(true);
    },
  );

  it.each(["shipped", "delivered", "cancelled", "refunded"] as const)(
    "%s は戻さない",
    (status) => {
      expect(canRestock(status)).toBe(false);
    },
  );
});
