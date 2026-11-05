import {
  fujisanProducts,
  getFujisanProductBySlug,
  primaryVolume,
  findVolume,
  type FujisanProduct,
  type FujisanVolume,
} from "@/data/fujisan-products";
import {
  SHIPPING_FEE,
  SHIPPING_REGIONS,
  type ShippingRegion,
} from "@/data/fujisan-legal";

export const CART_STORAGE_KEY = "fujisan_cart_v1";
/** 1 銘柄・容量あたりの上限本数（ProductPurchaseBlock の数量上限と揃える）。 */
export const MAX_QTY_PER_LINE = 12;

/** カート行は (slug, ml) で一意。同一銘柄でも容量が違えば別行。 */
export type CartLine = { slug: string; ml: number; qty: number };

/** カート行に商品・容量情報を結合したビュー。存在しない slug/容量は除外される。 */
export type CartLineView = CartLine & {
  product: FujisanProduct;
  volume: FujisanVolume;
  /** 1 本あたりの税込価格。実勢価格があればその値、無ければカタログ価格。 */
  unitPrice: number;
  /** この行の小計（unitPrice × qty）。 */
  lineTotal: number;
};

/**
 * 実勢価格の引き当て。`undefined` を返した SKU はカタログ価格で扱う。
 *
 * カートは静的配信のページから使われるため、**ビルド時に焼き込まれた
 * カタログ価格と、いま決済で請求される価格がずれうる**。決済と同じ金額を
 * 見せるために、クライアントが `/api/catalog` から取った値をここへ渡す。
 * 渡さなければ従来どおりカタログ価格で計算する。
 */
export type PriceLookup = (slug: string, ml: number) => number | undefined;

/** 実勢価格 → カタログ価格の順で 1 本あたりの価格を決める。 */
function unitPriceOf(
  volume: FujisanVolume,
  slug: string,
  priceOf?: PriceLookup,
): number {
  const live = priceOf?.(slug, volume.ml);
  return typeof live === "number" && Number.isFinite(live) && live >= 0
    ? live
    : volume.priceJpy;
}

function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.max(1, Math.min(MAX_QTY_PER_LINE, Math.floor(qty)));
}

/** (slug, ml) が実在商品・容量を指すか。 */
function isValidLine(slug: string, ml: number): boolean {
  const product = getFujisanProductBySlug(slug);
  return product ? Boolean(findVolume(product, ml)) : false;
}

function sameLine(line: CartLine, slug: string, ml: number): boolean {
  return line.slug === slug && line.ml === ml;
}

/** 既存カートに数量を加算する（同一 slug+容量はまとめる）。実在しない指定は無視。 */
export function addLine(
  items: CartLine[],
  slug: string,
  ml: number,
  qty = 1,
): CartLine[] {
  if (!isValidLine(slug, ml)) return items;
  const add = clampQty(qty);
  if (items.some((l) => sameLine(l, slug, ml))) {
    return items.map((l) =>
      sameLine(l, slug, ml) ? { ...l, qty: clampQty(l.qty + add) } : l,
    );
  }
  return [...items, { slug, ml, qty: add }];
}

/** 数量を上書きする。0 以下なら行を削除。 */
export function setLineQty(
  items: CartLine[],
  slug: string,
  ml: number,
  qty: number,
): CartLine[] {
  if (qty <= 0) return removeLine(items, slug, ml);
  return items.map((l) =>
    sameLine(l, slug, ml) ? { ...l, qty: clampQty(qty) } : l,
  );
}

export function removeLine(
  items: CartLine[],
  slug: string,
  ml: number,
): CartLine[] {
  return items.filter((l) => !sameLine(l, slug, ml));
}

/** localStorage 等から読んだ未知データを、実在商品・容量のみの正規化された行に変換。 */
export function normalizeLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  // key = `${slug}__${ml}` で同一 SKU をまとめる
  const merged = new Map<string, CartLine>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const slug = (entry as { slug?: unknown }).slug;
    if (typeof slug !== "string") continue;
    const product = getFujisanProductBySlug(slug);
    if (!product) continue;
    // ml 未指定・不正な旧データは既定容量（300ml）に寄せる
    const rawMl = (entry as { ml?: unknown }).ml;
    const ml =
      typeof rawMl === "number" && findVolume(product, rawMl)
        ? rawMl
        : primaryVolume(product).ml;
    const rawQty = (entry as { qty?: unknown }).qty;
    const q = clampQty(typeof rawQty === "number" ? rawQty : 1);
    const key = `${slug}__${ml}`;
    const prev = merged.get(key);
    merged.set(key, { slug, ml, qty: clampQty((prev?.qty ?? 0) + q) });
  }
  return [...merged.values()];
}

/** 商品・容量データを結合し、コレクションの並び順→容量の大きい順で返す。 */
export function toLineViews(
  items: CartLine[],
  priceOf?: PriceLookup,
): CartLineView[] {
  return items
    .map((l) => {
      const product = getFujisanProductBySlug(l.slug);
      const volume = product ? findVolume(product, l.ml) : undefined;
      if (!product || !volume) return null;
      const unitPrice = unitPriceOf(volume, l.slug, priceOf);
      return {
        ...l,
        product,
        volume,
        unitPrice,
        lineTotal: unitPrice * l.qty,
      };
    })
    .filter((l): l is CartLineView => l !== null)
    .sort((a, b) => {
      const order =
        fujisanProducts.indexOf(a.product) - fujisanProducts.indexOf(b.product);
      return order !== 0 ? order : b.ml - a.ml;
    });
}

/** カート内の合計本数。 */
export function cartCount(items: CartLine[]): number {
  return items.reduce((sum, l) => sum + l.qty, 0);
}

/** 税込小計（円）。実在しない slug/容量は 0 として扱う。 */
export function cartSubtotal(
  items: CartLine[],
  priceOf?: PriceLookup,
): number {
  return items.reduce((sum, l) => {
    const product = getFujisanProductBySlug(l.slug);
    const volume = product ? findVolume(product, l.ml) : undefined;
    return volume ? sum + unitPriceOf(volume, l.slug, priceOf) * l.qty : sum;
  }, 0);
}

/**
 * 小計とお届け地域に対する送料（円）。空カートは 0。
 * しきい値以上で無料になるのは基本送料だけで、地域の追加分は残る。
 */
export function shippingFee(
  subtotal: number,
  region: ShippingRegion = "mainland",
): number {
  if (subtotal <= 0) return 0;
  const threshold = SHIPPING_FEE.freeThresholdJpy;
  const base =
    threshold > 0 && subtotal >= threshold ? 0 : SHIPPING_FEE.flatJpy;
  return base + SHIPPING_REGIONS[region].surchargeJpy;
}

export function isShippingRegion(value: unknown): value is ShippingRegion {
  return typeof value === "string" && Object.hasOwn(SHIPPING_REGIONS, value);
}

type PostalArea = "hokkaido" | "okinawa" | "other";

/**
 * 郵便番号の先頭 2 桁から分かる区分。確実に分かるのは北海道（00・04〜09）と
 * 沖縄（90）だけで、01〜03 は東北。読めない番号は null。
 */
function postalAreaOf(postalCode: string): PostalArea | null {
  const digits = postalCode.replace(/\D/g, "");
  if (digits.length !== 7) return null;
  if (/^(00|0[4-9])/.test(digits)) return "hokkaido";
  if (digits.startsWith("90")) return "okinawa";
  return "other";
}

/** 郵便番号で確実に決まる地域。それ以外は離島のことがあるので null。 */
export function regionOfPostalCode(postalCode: string): ShippingRegion | null {
  const area = postalAreaOf(postalCode);
  if (area === "hokkaido") return "hokkaido";
  if (area === "okinawa") return "remote";
  return null;
}

/**
 * 選んだ地域が郵便番号と明らかに合わないか。「沖縄・離島」は北海道や本州の番号でも
 * 離島のことがあるので、合わないとは言えない。読めない番号は判定しない。
 */
export function shippingRegionMismatch(
  selected: ShippingRegion,
  postalCode: string,
): boolean {
  const area = postalAreaOf(postalCode);
  if (area === null) return false;
  if (selected === "mainland") return area !== "other";
  if (selected === "hokkaido") return area !== "hokkaido";
  return false;
}

/**
 * 発送前に人が確かめる注文か。明らかに合わないものに加えて、沖縄以外の番号で
 * 「沖縄・離島」が選ばれた注文も見る（離島は自己申告で、選び間違いと見分けられない）。
 */
export function shippingRegionNeedsReview(
  selected: ShippingRegion,
  postalCode: string,
): boolean {
  if (shippingRegionMismatch(selected, postalCode)) return true;
  const area = postalAreaOf(postalCode);
  return selected === "remote" && area !== null && area !== "okinawa";
}

/** 送料無料まであと何円か。無料化済み・無効時は 0。 */
export function amountToFreeShipping(subtotal: number): number {
  const threshold = SHIPPING_FEE.freeThresholdJpy;
  if (threshold <= 0 || subtotal <= 0) return 0;
  return Math.max(0, threshold - subtotal);
}
