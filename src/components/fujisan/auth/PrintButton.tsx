"use client";

/** 領収書を印刷（ブラウザの「PDF として保存」）するボタン。印刷時は自身を隠す。 */
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex cursor-pointer items-center gap-2 border border-[#0B1A2E] bg-[#0B1A2E] px-6 py-3 text-[10.5px] font-semibold tracking-[0.28em] text-paper-card transition-colors hover:bg-[#1D2432] print:hidden"
    >
      印刷 / PDF で保存
    </button>
  );
}
