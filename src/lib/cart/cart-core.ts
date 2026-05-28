import {
  fujisanProducts,
  getFujisanProductBySlug,
  type FujisanProduct,
} from "@/data/fujisan-products";
import { SHIPPING_FEE } from "@/data/fujisan-legal";

export const CART_STORAGE_KEY = "fujisan_cart_v1";
/** 1 銘柄あたりの上限本数（ProductPurchaseBlock の数量上限と揃える）。 */
export const MAX_QTY_PER_LINE = 12;

export type CartLine = { slug: string; qty: number };

/** カート行に商品情報を結合したビュー。存在しない slug は除外される。 */
export type CartLineView = CartLine & { product: FujisanProduct };

function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.max(1, Math.min(MAX_QTY_PER_LINE, Math.floor(qty)));
}

/** 既存カートに数量を加算する（同一 slug はまとめる）。実在しない slug は無視。 */
export function addLine(items: CartLine[], slug: string, qty = 1): CartLine[] {
  if (!getFujisanProductBySlug(slug)) return items;
  const add = clampQty(qty);
  if (items.some((l) => l.slug === slug)) {
    return items.map((l) =>
      l.slug === slug ? { ...l, qty: clampQty(l.qty + add) } : l,
    );
  }
  return [...items, { slug, qty: add }];
}

/** 数量を上書きする。0 以下なら行を削除。 */
export function setLineQty(
  items: CartLine[],
  slug: string,
  qty: number,
): CartLine[] {
  if (qty <= 0) return removeLine(items, slug);
  return items.map((l) => (l.slug === slug ? { ...l, qty: clampQty(qty) } : l));
}

export function removeLine(items: CartLine[], slug: string): CartLine[] {
  return items.filter((l) => l.slug !== slug);
}

/** localStorage 等から読んだ未知データを、実在商品のみの正規化された行に変換。 */
export function normalizeLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];
  const merged = new Map<string, number>();
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const slug = (entry as { slug?: unknown }).slug;
    const qty = (entry as { qty?: unknown }).qty;
    if (typeof slug !== "string" || !getFujisanProductBySlug(slug)) continue;
    const q = clampQty(typeof qty === "number" ? qty : 1);
    merged.set(slug, clampQty((merged.get(slug) ?? 0) + q));
  }
  return [...merged.entries()].map(([slug, qty]) => ({ slug, qty }));
}

/** 商品データを結合し、コレクションの並び順を保って返す。 */
export function toLineViews(items: CartLine[]): CartLineView[] {
  return items
    .map((l) => {
      const product = getFujisanProductBySlug(l.slug);
      return product ? { ...l, product } : null;
    })
    .filter((l): l is CartLineView => l !== null)
    .sort(
      (a, b) =>
        fujisanProducts.indexOf(a.product) - fujisanProducts.indexOf(b.product),
    );
}

/** カート内の合計本数。 */
export function cartCount(items: CartLine[]): number {
  return items.reduce((sum, l) => sum + l.qty, 0);
}

/** 税込小計（円）。実在しない slug は 0 として扱う。 */
export function cartSubtotal(items: CartLine[]): number {
  return items.reduce((sum, l) => {
    const product = getFujisanProductBySlug(l.slug);
    return product ? sum + product.priceJpy * l.qty : sum;
  }, 0);
}

/** 小計に対する送料（円）。空カートは 0、しきい値以上は無料。 */
export function shippingFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  const threshold = SHIPPING_FEE.freeThresholdJpy;
  if (threshold > 0 && subtotal >= threshold) return 0;
  return SHIPPING_FEE.flatJpy;
}

/** 送料無料まであと何円か。無料化済み・無効時は 0。 */
export function amountToFreeShipping(subtotal: number): number {
  const threshold = SHIPPING_FEE.freeThresholdJpy;
  if (threshold <= 0 || subtotal <= 0) return 0;
  return Math.max(0, threshold - subtotal);
}
