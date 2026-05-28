import type { ReactNode } from "react";
import { L } from "@/i18n/Localized";

export const inputCls =
  "w-full border-b border-[#0F1F36]/30 bg-transparent py-3 text-[15px] text-[#0F1F36] outline-none transition-colors placeholder:text-[#0F1F36]/40 focus:border-[#C9A84C]";

export function Field({
  id,
  label,
  jp,
  children,
}: {
  id: string;
  label: string;
  jp: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[12px] font-semibold tracking-[0.16em] text-[#0B1A2E]/75"
      >
        <L ja={jp} en={label} />
      </label>
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  disabled,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-3 border border-[#0B1A2E] bg-[#0B1A2E] px-7 py-3.5 text-[11px] font-semibold tracking-[0.28em] text-[#F8F3E7] transition-colors hover:bg-[#16273d] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function Notice({
  tone,
  children,
}: {
  tone: "error" | "info" | "success";
  children: ReactNode;
}) {
  const cls =
    tone === "error"
      ? "border-[#8B1A1A]/40 bg-[#8B1A1A]/[0.06] text-[#8B1A1A]"
      : "border-[#C9A84C]/50 bg-[#F1E6CB]/55 text-[#0B1A2E]";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`border px-4 py-3 text-[12.5px] leading-[1.65] ${cls}`}
    >
      {children}
    </div>
  );
}

export function OrDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-1">
      <span className="h-px flex-1 bg-[#0F1F36]/14" />
      <span className="text-[10px] font-semibold tracking-[0.3em] text-[#0F1F36]/45">
        {children}
      </span>
      <span className="h-px flex-1 bg-[#0F1F36]/14" />
    </div>
  );
}
