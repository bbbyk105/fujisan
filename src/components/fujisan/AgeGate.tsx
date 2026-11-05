"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { UNDERAGE_NOTICE_JP, UNDERAGE_NOTICE_EN } from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-indigo/92 px-6"
    >
      <div className="w-full max-w-[460px] bg-paper-card px-7 py-9 text-center text-indigo md:px-10 md:py-12">
        <h2
          id="age-gate-title"
          className="font-serif text-[clamp(22px,2.6vw,28px)] font-semibold leading-[1.25] tracking-[0.06em]"
        >
          <L
            ja="あなたは20歳以上ですか？"
            en="Are you 20 years of age or older?"
          />
        </h2>

        <div
          id="age-gate-desc"
          className="mt-6 space-y-1.5 text-[12.5px] leading-[1.7] text-indigo/80"
        >
          <L
            ja={
              <>
                {UNDERAGE_NOTICE_JP.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </>
            }
            en={
              <>
                {UNDERAGE_NOTICE_EN.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </>
            }
          />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={onYes} className="ed-btn">
            <L ja="はい（20歳以上）" en="Yes, I am 20 or older" />
          </button>
          <button type="button" onClick={onNo} className="ed-btn-ghost">
            <L ja="いいえ" en="No" />
          </button>
        </div>
      </div>
    </div>
  );
}
