import {
  ORDER_STATUSES,
  isReceiptIssuable,
  isRefundable,
  parseOrderItems,
  stockStateFor,
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

describe("stockStateFor", () => {
  it.each(["confirmed", "preparing"] as const)(
    "%s は品物が蔵にある状態にする",
    (status) => {
      expect(stockStateFor(status, "reserved")).toBe("committed");
      expect(stockStateFor(status, "none")).toBe("committed");
    },
  );

  it.each(["shipped", "delivered"] as const)(
    "%s は品物が蔵を出た状態にする",
    (status) => {
      expect(stockStateFor(status, "reserved")).toBe("shipped");
      expect(stockStateFor(status, "committed")).toBe("shipped");
    },
  );

  // 蔵にある分だけ戻す。蔵を出た品物は手元に無いので、状態を変えない。
  it.each(["cancelled", "refunded"] as const)(
    "%s は蔵にある分を戻し、蔵を出た分は戻さない",
    (status) => {
      expect(stockStateFor(status, "reserved")).toBe("none");
      expect(stockStateFor(status, "committed")).toBe("none");
      expect(stockStateFor(status, "none")).toBe("none");
      expect(stockStateFor(status, "shipped")).toBe("shipped");
    },
  );

  // 品物の場所は操作からは分からない。自動で足すと売り越すので、蔵を出た扱いは解かない。
  it.each(["pending", "confirmed", "preparing", "cancelled", "refunded"] as const)(
    "蔵を出た注文は %s にしても蔵を出たままにする",
    (status) => {
      expect(stockStateFor(status, "shipped")).toBe("shipped");
    },
  );

  // pending は引き当て中のことも、確定を手で戻した引き落とし済みのこともある。
  it.each(["reserved", "committed", "none"] as const)(
    "pending は在庫の状態（%s）を動かさない",
    (current) => {
      expect(stockStateFor("pending", current)).toBe(current);
    },
  );
});

describe("isRefundable", () => {
  it.each(["confirmed", "preparing", "shipped", "delivered"] as const)(
    "%s は返金できる",
    (status) => {
      expect(isRefundable({ status, paidAt: null })).toBe(true);
    },
  );

  it("入金後に取り消した注文は返金できる", () => {
    expect(
      isRefundable({ status: "cancelled", paidAt: new Date(1000) }),
    ).toBe(true);
  });

  it("入金済みで手で pending へ戻した注文は返金できる", () => {
    expect(isRefundable({ status: "pending", paidAt: new Date(1000) })).toBe(
      true,
    );
  });

  it.each(["pending", "cancelled"] as const)(
    "未入金の %s は返金できない",
    (status) => {
      expect(isRefundable({ status, paidAt: null })).toBe(false);
    },
  );

  it("返金済みの注文は返金できない", () => {
    expect(isRefundable({ status: "refunded", paidAt: new Date(1000) })).toBe(
      false,
    );
  });
});

describe("parseOrderItems", () => {
  it("壊れた値や配列でない値は空にする", () => {
    expect(parseOrderItems("not json")).toEqual([]);
    expect(parseOrderItems('{"slug":"shogun"}')).toEqual([]);
  });

  it("明細をそのまま返す", () => {
    expect(parseOrderItems('[{"slug":"shogun","qty":2}]')).toEqual([
      { slug: "shogun", qty: 2 },
    ]);
  });
});
