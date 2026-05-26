"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { UNDERAGE_NOTICE_JP } from "@/data/fujisan-legal";

const STORAGE_KEY = "fujisan-age-confirmed";
const REJECT_REDIRECT =
  "https://www.kenkou-kazoku.metro.tokyo.lg.jp/seishounen/inshu.html";

// localStorage を外部ストアとして読む（一度きりの読み取り。購読は不要）。
// SSR では「確認済み」とみなしてモーダルを出さず、ハイドレーション不整合を避ける。
const subscribeNoop = () => () => {};
function getConfirmedSnapshot(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "yes";
  } catch {
    return false;
  }
}
function getConfirmedServerSnapshot(): boolean {
  return true;
}

export default function AgeGate() {
  const confirmed = useSyncExternalStore(
    subscribeNoop,
    getConfirmedSnapshot,
    getConfirmedServerSnapshot,
  );
  // 当セッション中に「はい」を押して閉じた状態
  const [dismissed, setDismissed] = useState(false);
  const open = !confirmed && !dismissed;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const onYes = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "yes");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const onNo = () => {
    window.location.replace(REJECT_REDIRECT);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      aria-describedby="age-gate-desc"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1A2E]/85 px-6 backdrop-blur-sm"
    >
      <div className="w-full max-w-[460px] border border-[#D7B46A]/40 bg-[#F8F3E7] px-7 py-9 text-center text-[#0B1A2E] shadow-[0_30px_70px_rgba(11,26,46,0.45)] md:px-10 md:py-12">
        <p className="font-serif text-[10.5px] font-semibold tracking-[0.34em] text-[#C9A84C]">
          AGE VERIFICATION
        </p>
        <div className="mx-auto mt-3 h-px w-10 bg-[#C9A84C]/60" />

        <h2
          id="age-gate-title"
          className="mt-6 font-serif text-[clamp(22px,2.6vw,28px)] font-semibold leading-[1.25] tracking-[0.06em]"
        >
          あなたは20歳以上ですか？
        </h2>
        <p className="mt-2 font-serif text-[12px] tracking-[0.18em] text-[#0B1A2E]/70">
          Are you 20 years of age or older?
        </p>

        <div
          id="age-gate-desc"
          className="mt-7 space-y-1.5 text-[11.5px] leading-[1.7] text-[#1D2432]/80"
        >
          {UNDERAGE_NOTICE_JP.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onYes}
            className="cursor-pointer border border-[#0B1A2E] bg-[#0B1A2E] px-7 py-3 text-[11px] font-semibold tracking-[0.28em] text-[#F8F3E7] transition-colors hover:bg-[#1D2432]"
          >
            はい（20歳以上）
          </button>
          <button
            type="button"
            onClick={onNo}
            className="cursor-pointer border border-[#0B1A2E]/30 bg-transparent px-7 py-3 text-[11px] font-semibold tracking-[0.28em] text-[#0B1A2E]/75 transition-colors hover:border-[#0B1A2E]/60 hover:text-[#0B1A2E]"
          >
            いいえ
          </button>
        </div>

        <p className="mt-7 text-[10.5px] leading-[1.7] tracking-[0.04em] text-[#1D2432]/60">
          ご利用にあたり、ご年齢をご確認ください。20歳未満の方の閲覧・購入はご遠慮いただいております。
        </p>
      </div>
    </div>
  );
}
