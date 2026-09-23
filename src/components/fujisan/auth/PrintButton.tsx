"use client";

/** 領収書を印刷（ブラウザの「PDF として保存」）するボタン。印刷時は自身を隠す。 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="ed-btn print:hidden"
    >
      印刷 / PDF で保存
    </button>
  );
}
