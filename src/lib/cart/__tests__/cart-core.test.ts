import {
  MAX_QTY_PER_LINE,
  addLine,
  amountToFreeShipping,
  cartCount,
  cartSubtotal,
  normalizeLines,
  removeLine,
  setLineQty,
  shippingFee,
  toLineViews,
  type CartLine,
} from "@/lib/cart/cart-core";
import { fujisanProducts } from "@/data/fujisan-products";
import { SHIPPING_FEE } from "@/data/fujisan-legal";

// 実在の slug / 価格を使う（データ駆動でテストが陳腐化しないように）
const A = fujisanProducts[0]; // honjozo, 3300
const B = fujisanProducts[1]; // junmai, 3850

describe("addLine", () => {
  it("adds a new line", () => {
    expect(addLine([], A.slug, 2)).toEqual([{ slug: A.slug, qty: 2 }]);
  });

  it("merges quantities for the same slug", () => {
    const items: CartLine[] = [{ slug: A.slug, qty: 1 }];
    expect(addLine(items, A.slug, 3)).toEqual([{ slug: A.slug, qty: 4 }]);
  });

  it("clamps to the per-line maximum", () => {
    expect(addLine([], A.slug, 999)).toEqual([
      { slug: A.slug, qty: MAX_QTY_PER_LINE },
    ]);
  });

  it("ignores unknown slugs", () => {
    expect(addLine([], "not-a-real-slug", 1)).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const items: CartLine[] = [{ slug: A.slug, qty: 1 }];
    addLine(items, B.slug, 1);
    expect(items).toEqual([{ slug: A.slug, qty: 1 }]);
  });
});

describe("setLineQty", () => {
  it("overwrites the quantity", () => {
    const items: CartLine[] = [{ slug: A.slug, qty: 1 }];
    expect(setLineQty(items, A.slug, 5)).toEqual([{ slug: A.slug, qty: 5 }]);
  });

  it("removes the line when set to zero or below", () => {
    const items: CartLine[] = [
      { slug: A.slug, qty: 2 },
      { slug: B.slug, qty: 1 },
    ];
    expect(setLineQty(items, A.slug, 0)).toEqual([{ slug: B.slug, qty: 1 }]);
  });
});

describe("removeLine", () => {
  it("removes only the matching slug", () => {
    const items: CartLine[] = [
      { slug: A.slug, qty: 1 },
      { slug: B.slug, qty: 1 },
    ];
    expect(removeLine(items, A.slug)).toEqual([{ slug: B.slug, qty: 1 }]);
  });
});

describe("normalizeLines", () => {
  it("returns empty for non-arrays", () => {
    expect(normalizeLines(null)).toEqual([]);
    expect(normalizeLines({})).toEqual([]);
  });

  it("drops unknown slugs and merges duplicates", () => {
    const result = normalizeLines([
      { slug: A.slug, qty: 2 },
      { slug: "ghost", qty: 5 },
      { slug: A.slug, qty: 1 },
    ]);
    expect(result).toEqual([{ slug: A.slug, qty: 3 }]);
  });

  it("clamps and floors invalid quantities", () => {
    expect(normalizeLines([{ slug: A.slug, qty: -4 }])).toEqual([
      { slug: A.slug, qty: 1 },
    ]);
  });
});

describe("totals", () => {
  const items: CartLine[] = [
    { slug: A.slug, qty: 2 },
    { slug: B.slug, qty: 1 },
  ];

  it("counts total bottles", () => {
    expect(cartCount(items)).toBe(3);
  });

  it("sums tax-inclusive prices", () => {
    expect(cartSubtotal(items)).toBe(A.priceJpy * 2 + B.priceJpy);
  });

  it("ignores unknown slugs in the subtotal", () => {
    expect(cartSubtotal([{ slug: "ghost", qty: 3 }])).toBe(0);
  });
});

describe("shipping", () => {
  const { flatJpy, freeThresholdJpy } = SHIPPING_FEE;

  it("charges the flat fee below the free-shipping threshold", () => {
    expect(shippingFee(freeThresholdJpy - 1)).toBe(flatJpy);
  });

  it("is free at or above the threshold", () => {
    expect(shippingFee(freeThresholdJpy)).toBe(0);
    expect(shippingFee(freeThresholdJpy + 5000)).toBe(0);
  });

  it("is free for an empty cart", () => {
    expect(shippingFee(0)).toBe(0);
  });

  it("reports the remaining amount to free shipping", () => {
    expect(amountToFreeShipping(freeThresholdJpy - 800)).toBe(800);
  });

  it("reports zero remaining once the threshold is met", () => {
    expect(amountToFreeShipping(freeThresholdJpy)).toBe(0);
    expect(amountToFreeShipping(freeThresholdJpy + 1)).toBe(0);
  });
});

describe("toLineViews", () => {
  it("joins product data and preserves collection order", () => {
    const views = toLineViews([
      { slug: B.slug, qty: 1 },
      { slug: A.slug, qty: 1 },
    ]);
    expect(views.map((v) => v.slug)).toEqual([A.slug, B.slug]);
    expect(views[0].product.name).toBe(A.name);
  });
});
