"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart/useCart";

/**
 * 決済成功ページでマウント時に一度だけカートを空にする。
 * 在庫確定は Webhook 側で行うため、ここでは表示用のローカルカートを掃除するだけ。
 */
export function ClearCartOnMount() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
    // 初回マウントで一度だけ。clear は安定参照でなくても二重実行は無害。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
