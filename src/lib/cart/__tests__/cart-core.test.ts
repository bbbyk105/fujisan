import {
  MAX_QTY_PER_LINE,
  addLine,
  amountToFreeShipping,
  isShippingRegion,
  regionOfPostalCode,
  shippingRegionMismatch,
  shippingRegionNeedsReview,
  cartCount,
  cartSubtotal,
  normalizeLines,
  removeLine,
  setLineQty,
  shippingFee,
  toLineViews,
  type CartLine,
} from "@/lib/cart/cart-core";
import { fujisanProducts, primaryVolume } from "@/data/fujisan-products";
import { SHIPPING_FEE, SHIPPING_REGIONS } from "@/data/fujisan-legal";

// 実在の slug / 容量 / 価格を使う（データ駆動でテストが陳腐化しないように）
const A = fujisanProducts[0]; // shogun（300ml / 180ml）
const B = fujisanProducts[1]; // tenka
const A_ML = primaryVolume(A).ml; // 300
// 複数容量を持つ銘柄の 2 つめの容量（180ml）
const A_ML2 = A.volumes[1]?.ml ?? A_ML;
const B_ML = primaryVolume(B).ml;

describe("addLine", () => {
  it("adds a new line", () => {
    expect(addLine([], A.slug, A_ML, 2)).toEqual([
      { slug: A.slug, ml: A_ML, qty: 2 },
    ]);
  });

  it("merges quantities for the same slug+volume", () => {
    const items: CartLine[] = [{ slug: A.slug, ml: A_ML, qty: 1 }];
    expect(addLine(items, A.slug, A_ML, 3)).toEqual([
      { slug: A.slug, ml: A_ML, qty: 4 },
    ]);
  });

  it("keeps different volumes of the same slug as separate lines", () => {
    if (A_ML2 === A_ML) return; // 単一容量銘柄ではスキップ
    const items: CartLine[] = [{ slug: A.slug, ml: A_ML, qty: 1 }];
    expect(addLine(items, A.slug, A_ML2, 1)).toEqual([
      { slug: A.slug, ml: A_ML, qty: 1 },
      { slug: A.slug, ml: A_ML2, qty: 1 },
    ]);
  });

  it("clamps to the per-line maximum", () => {
    expect(addLine([], A.slug, A_ML, 999)).toEqual([
      { slug: A.slug, ml: A_ML, qty: MAX_QTY_PER_LINE },
    ]);
  });

  it("ignores unknown slugs", () => {
    expect(addLine([], "not-a-real-slug", A_ML, 1)).toEqual([]);
  });

  it("ignores volumes the product does not offer", () => {
    expect(addLine([], A.slug, 999, 1)).toEqual([]);
  });

  it("does not mutate the input array", () => {
    const items: CartLine[] = [{ slug: A.slug, ml: A_ML, qty: 1 }];
    addLine(items, B.slug, B_ML, 1);
    expect(items).toEqual([{ slug: A.slug, ml: A_ML, qty: 1 }]);
  });
});

describe("setLineQty", () => {
  it("overwrites the quantity", () => {
    const items: CartLine[] = [{ slug: A.slug, ml: A_ML, qty: 1 }];
    expect(setLineQty(items, A.slug, A_ML, 5)).toEqual([
      { slug: A.slug, ml: A_ML, qty: 5 },
    ]);
  });

  it("removes the line when set to zero or below", () => {
    const items: CartLine[] = [
      { slug: A.slug, ml: A_ML, qty: 2 },
      { slug: B.slug, ml: B_ML, qty: 1 },
    ];
    expect(setLineQty(items, A.slug, A_ML, 0)).toEqual([
      { slug: B.slug, ml: B_ML, qty: 1 },
    ]);
  });
});

describe("removeLine", () => {
  it("removes only the matching slug+volume", () => {
    const items: CartLine[] = [
      { slug: A.slug, ml: A_ML, qty: 1 },
      { slug: B.slug, ml: B_ML, qty: 1 },
    ];
    expect(removeLine(items, A.slug, A_ML)).toEqual([
      { slug: B.slug, ml: B_ML, qty: 1 },
    ]);
  });
});

describe("normalizeLines", () => {
  it("returns empty for non-arrays", () => {
    expect(normalizeLines(null)).toEqual([]);
    expect(normalizeLines({})).toEqual([]);
  });

  it("drops unknown slugs and merges duplicates", () => {
    const result = normalizeLines([
      { slug: A.slug, ml: A_ML, qty: 2 },
      { slug: "ghost", ml: A_ML, qty: 5 },
      { slug: A.slug, ml: A_ML, qty: 1 },
    ]);
    expect(result).toEqual([{ slug: A.slug, ml: A_ML, qty: 3 }]);
  });

  it("defaults missing/invalid volume to the primary SKU", () => {
    expect(normalizeLines([{ slug: A.slug, qty: 2 }])).toEqual([
      { slug: A.slug, ml: A_ML, qty: 2 },
    ]);
    expect(normalizeLines([{ slug: A.slug, ml: 999, qty: 2 }])).toEqual([
      { slug: A.slug, ml: A_ML, qty: 2 },
    ]);
  });

  it("clamps and floors invalid quantities", () => {
    expect(normalizeLines([{ slug: A.slug, ml: A_ML, qty: -4 }])).toEqual([
      { slug: A.slug, ml: A_ML, qty: 1 },
    ]);
  });
});

describe("totals", () => {
  const items: CartLine[] = [
    { slug: A.slug, ml: A_ML, qty: 2 },
    { slug: B.slug, ml: B_ML, qty: 1 },
  ];

  it("counts total bottles", () => {
    expect(cartCount(items)).toBe(3);
  });

  it("sums tax-inclusive prices by volume", () => {
    const aPrice = primaryVolume(A).priceJpy;
    const bPrice = primaryVolume(B).priceJpy;
    expect(cartSubtotal(items)).toBe(aPrice * 2 + bPrice);
  });

  it("ignores unknown slugs in the subtotal", () => {
    expect(cartSubtotal([{ slug: "ghost", ml: A_ML, qty: 3 }])).toBe(0);
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
  it("joins product+volume data and preserves collection order", () => {
    const views = toLineViews([
      { slug: B.slug, ml: B_ML, qty: 1 },
      { slug: A.slug, ml: A_ML, qty: 1 },
    ]);
    expect(views.map((v) => v.slug)).toEqual([A.slug, B.slug]);
    expect(views[0].product.name).toBe(A.name);
    expect(views[0].volume.ml).toBe(A_ML);
  });
});

describe("お届け地域の送料", () => {
  const { flatJpy, freeThresholdJpy } = SHIPPING_FEE;
  const { hokkaido, remote } = SHIPPING_REGIONS;

  it("基本送料に地域の追加分を足す", () => {
    expect(shippingFee(1000)).toBe(flatJpy);
    expect(shippingFee(1000, "mainland")).toBe(flatJpy);
    expect(shippingFee(1000, "hokkaido")).toBe(flatJpy + hokkaido.surchargeJpy);
    expect(shippingFee(1000, "remote")).toBe(flatJpy + remote.surchargeJpy);
  });

  it("送料無料になるのは基本送料だけで、地域の追加分は残る", () => {
    expect(shippingFee(freeThresholdJpy, "mainland")).toBe(0);
    expect(shippingFee(freeThresholdJpy, "hokkaido")).toBe(hokkaido.surchargeJpy);
    expect(shippingFee(freeThresholdJpy, "remote")).toBe(remote.surchargeJpy);
  });

  it("空のカートは地域にかかわらず 0 円", () => {
    expect(shippingFee(0, "remote")).toBe(0);
  });

  it("知らない地域は受け付けない", () => {
    expect(isShippingRegion("hokkaido")).toBe(true);
    expect(isShippingRegion("mars")).toBe(false);
    expect(isShippingRegion("toString")).toBe(false);
    expect(isShippingRegion(undefined)).toBe(false);
  });
});

describe("郵便番号からの地域の判定", () => {
  it.each([
    ["0600001", "hokkaido"], // 札幌市（06）
    ["0010010", "hokkaido"], // 札幌市（00）
    ["0400001", "hokkaido"], // 函館市（04）
    ["0980000", "hokkaido"], // 稚内周辺（09）
    ["9000001", "remote"], // 那覇市
    ["907-0000", "remote"], // 石垣市（ハイフン付き）
  ])("%s は %s", (postal, region) => {
    expect(regionOfPostalCode(postal)).toBe(region);
  });

  it.each([
    ["0100001"], // 秋田市
    ["0200021"], // 盛岡市
    ["0300801"], // 青森市
    ["4170051"], // 富士市
    ["1000001"], // 千代田区
  ])("%s は判定できる地域ではない", (postal) => {
    expect(regionOfPostalCode(postal)).toBeNull();
  });

  it("7 桁でなければ判定しない", () => {
    expect(regionOfPostalCode("060")).toBeNull();
    expect(regionOfPostalCode("")).toBeNull();
  });
});

describe("選んだ地域と住所の食い違い", () => {
  it("本州などを選んで北海道・沖縄の住所なら食い違い", () => {
    expect(shippingRegionMismatch("mainland", "0600001")).toBe(true);
    expect(shippingRegionMismatch("mainland", "9000001")).toBe(true);
    expect(shippingRegionMismatch("mainland", "1000001")).toBe(false);
  });

  it("北海道を選んでほかの住所なら食い違い", () => {
    expect(shippingRegionMismatch("hokkaido", "0600001")).toBe(false);
    expect(shippingRegionMismatch("hokkaido", "1000001")).toBe(true);
  });

  it("「沖縄・離島」はどの番号でも離島のことがあるので食い違いにしない", () => {
    expect(shippingRegionMismatch("remote", "9000001")).toBe(false);
    expect(shippingRegionMismatch("remote", "1000001")).toBe(false);
    expect(shippingRegionMismatch("remote", "0970101")).toBe(false); // 利尻
  });

  it("郵便番号が読めなければ判定しない", () => {
    expect(shippingRegionMismatch("mainland", "")).toBe(false);
  });
});

describe("発送前に人が確かめる注文", () => {
  it("明らかに合わない注文を含む", () => {
    expect(shippingRegionNeedsReview("mainland", "0600001")).toBe(true);
  });

  it("沖縄以外の番号で「沖縄・離島」が選ばれた注文を含む", () => {
    expect(shippingRegionNeedsReview("remote", "1000001")).toBe(true);
    expect(shippingRegionNeedsReview("remote", "0970101")).toBe(true);
  });

  it("沖縄の番号で「沖縄・離島」なら確かめなくてよい", () => {
    expect(shippingRegionNeedsReview("remote", "9000001")).toBe(false);
  });

  it("郵便番号が読めなければ判定しない", () => {
    expect(shippingRegionNeedsReview("remote", "")).toBe(false);
  });
});
