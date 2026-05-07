import type { ReactNode } from "react";

/**
 * 言語切替の中核コンポーネント。
 * SSR では両言語をマークアップに出力し、`<html data-locale="ja|en">` を
 * グローバル CSS で参照して片方を `display:none` で隠す方式。
 *
 * これによりハイドレーションのちらつきが起きず、静的書き出しのまま
 * Cloudflare Workers で配信できる。
 */
export function L({
  ja,
  en,
}: {
  ja: ReactNode;
  en: ReactNode;
}) {
  return (
    <>
      <span className="i18n-fragment i18n-ja">{ja}</span>
      <span className="i18n-fragment i18n-en">{en}</span>
    </>
  );
}

/** 文字列のみを切り替えたい場合の薄いラッパー */
export function LText({ ja, en }: { ja: string; en: string }) {
  return <L ja={ja} en={en} />;
}
