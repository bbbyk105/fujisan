"use client";

import { useSyncExternalStore } from "react";
import { cartCount, cartSubtotal, toLineViews } from "./cart-core";
import type { CartLineView } from "./cart-core";
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

  return {
    ready,
    lines: toLineViews(items),
    count: cartCount(items),
    subtotal: cartSubtotal(items),
    add: addToCart,
    setQty: setCartQty,
    remove: removeFromCart,
    clear: clearCart,
  };
}
