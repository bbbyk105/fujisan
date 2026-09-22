"use client";

import { useSyncExternalStore } from "react";
import { cartCount, cartSubtotal, toLineViews } from "./cart-core";
import type { CartLineView, PriceLookup } from "./cart-core";
import { useLiveCatalog, liveKey } from "./useLiveCatalog";
import {
  addToCart,
  clearCart,
  getCartServerSnapshot,
  getCartSnapshot,
  getReadyServerSnapshot,
  getReadySnapshot,
  removeFromCart,
  setCartQty,
  subscribeCart,
} from "./cart-store";

type UseCart = {
  /** localStorage 読込み後に true。SSR/初回描画では false。 */
  ready: boolean;
  /** 実勢価格・在庫を取得済みか。false のあいだはカタログ価格で表示している。 */
  liveReady: boolean;
  lines: CartLineView[];
  count: number;
  subtotal: number;
  add: (slug: string, ml: number, qty?: number) => void;
  setQty: (slug: string, ml: number, qty: number) => void;
  remove: (slug: string, ml: number) => void;
  clear: () => void;
};

export function useCart(): UseCart {
  const items = useSyncExternalStore(
    subscribeCart,
    getCartSnapshot,
    getCartServerSnapshot,
  );
  const ready = useSyncExternalStore(
    subscribeCart,
    getReadySnapshot,
    getReadyServerSnapshot,
  );

  // 実勢価格。商品ページ・カートは静的配信なので、管理画面で価格を変えても
  // 焼き込まれた値のままになる。ここで差し替えないと、カートの合計と
  // 実際に請求される金額（startCheckoutAction が引き直す）がずれる。
  const { ready: liveReady, catalog } = useLiveCatalog();
  const priceOf: PriceLookup = (slug, ml) => catalog[liveKey(slug, ml)]?.price;

  return {
    ready,
    liveReady,
    lines: toLineViews(items, priceOf),
    count: cartCount(items),
    subtotal: cartSubtotal(items, priceOf),
    add: addToCart,
    setQty: setCartQty,
    remove: removeFromCart,
    clear: clearCart,
  };
}
