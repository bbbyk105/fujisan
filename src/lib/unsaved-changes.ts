"use client";

import { useEffect } from "react";

/**
 * 保存していない変更の追跡。
 *
 * 各フォームは「いま未保存の変更があるか」を `useUnsavedChanges(dirty)` で
 * 知らせるだけにし、移動を止めるのは layout に 1 つだけ置いた
 * `UnsavedChangesGuard` が受け持つ。フォームごとに移動の監視を持たせると、
 * 同じ画面に未保存のフォームが 2 つあるとき確認が 2 回出る。
 *
 * React の状態ではなくモジュールの Set で持つ。Provider で包む必要が無く、
 * Server Component のページにも手を入れずに済む。
 */
const dirtySources = new Set<symbol>();

export function hasUnsavedChanges(): boolean {
  return dirtySources.size > 0;
}

/** 未保存の変更があるあいだ、画面の移動に確認を挟む */
export function useUnsavedChanges(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return;
    const key = Symbol("unsaved");
    dirtySources.add(key);
    return () => {
      dirtySources.delete(key);
    };
  }, [isDirty]);
}

function message(): string {
  const en =
    typeof document !== "undefined" &&
    document.documentElement.dataset.locale === "en";
  return en
    ? "You have unsaved changes.\nIf you leave this page now, they will be lost. Leave anyway?"
    : "保存していない変更があります。\nこのまま移動すると、変更は失われます。移動しますか？";
}

/**
 * 移動してよいかを尋ねる。未保存が無ければ尋ねずに通す。
 * 「移動する」を選んだら登録を捨てる（移動の途中でもう一度聞かないため）。
 */
export function confirmLeave(): boolean {
  if (dirtySources.size === 0) return true;
  const ok = window.confirm(message());
  if (ok) dirtySources.clear();
  return ok;
}
