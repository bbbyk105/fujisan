"use client";

import Link from "next/link";
import { dismissToast } from "@/lib/cart/toast-store";
import { useToasts } from "@/lib/cart/useToasts";
import { L } from "@/i18n/Localized";

export function Toaster() {
  const toasts = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[90] flex flex-col items-center gap-2.5 px-5 sm:inset-x-auto sm:right-7 sm:items-end"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="fujisan-toast pointer-events-auto flex w-full max-w-[360px] items-center gap-4 border border-[#C9A84C]/30 bg-[#0B1A2E] px-5 py-3.5 text-[#F8F3E7] shadow-[0_18px_44px_rgba(11,26,46,0.4)]"
        >
          <span className="text-[#C9A84C]" aria-hidden>
            ✓
          </span>
          <p className="flex-1 text-[12.5px] leading-[1.5] tracking-[0.04em]">
            <L en={toast.en} ja={toast.ja} />
          </p>
          {toast.action ? (
            <Link
              href={toast.action.href}
              onClick={() => dismissToast(toast.id)}
              className="group/toast shrink-0 text-[10.5px] font-semibold tracking-[0.18em] text-[#C9A84C] no-underline"
            >
              <span className="relative pb-0.5">
                <L en={toast.action.en} ja={toast.action.ja} />
                <span className="absolute inset-x-0 bottom-0 h-px bg-[#C9A84C]/40 transition-colors duration-300 group-hover/toast:bg-[#C9A84C]" />
              </span>
            </Link>
          ) : null}
          <button
            type="button"
            aria-label="閉じる"
            onClick={() => dismissToast(toast.id)}
            className="shrink-0 cursor-pointer text-[15px] leading-none text-[#F8F3E7]/55 transition-colors hover:text-[#F8F3E7]"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
