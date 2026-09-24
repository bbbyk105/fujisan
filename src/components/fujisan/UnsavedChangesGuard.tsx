"use client";

import { useEffect } from "react";
import { confirmLeave, hasUnsavedChanges } from "@/lib/unsaved-changes";

/**
 * 保存していない変更があるとき、画面の移動を止めて確認を出す。layout に 1 つだけ置く。
 *
 * - タブを閉じる・再読み込み・外部サイトへ出る → `beforeunload`
 *   （文言はブラウザが決める。独自の文言は出せない）
 * - サイト内のリンク → クリックを捕捉段階で受け、確認で「キャンセル」なら止める。
 *   Next.js の `<Link onNavigate>` でも止められるが、それだとサイト中のリンクを
 *   すべて差し替えることになる。document の capture で受ければ、React が
 *   Link の onClick を受け取る前に止められる。
 *
 * ブラウザの「戻る」は App Router では止められない（popstate は取り消せず、
 * Next.js の router が先に処理する）。
 */
export function UnsavedChangesGuard() {
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges()) return;
      e.preventDefault();
      // 古いブラウザは returnValue が無いと確認を出さない
      e.returnValue = "";
    };

    const onClick = (e: MouseEvent) => {
      if (!hasUnsavedChanges()) return;
      // 新しいタブで開く操作は、この画面を離れないので止めない
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }
      const target = e.target as Element | null;
      const a = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;

      const url = new URL(a.href, window.location.href);
      // mailto: や tel: は画面を離れない
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      // 同じページの中の #見出し への移動も離れない
      const here = window.location;
      if (
        url.origin === here.origin &&
        url.pathname === here.pathname &&
        url.search === here.search &&
        url.hash !== ""
      ) {
        return;
      }

      if (!confirmLeave()) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return null;
}
