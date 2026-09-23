import type { ReactNode } from "react";
import { L } from "@/i18n/Localized";

// 未入力・不正な項目は枠を赤くする（aria-invalid="true" の入力に適用）。
export const inputCls =
  "w-full border-b border-indigo/25 bg-transparent py-3 text-[15px] text-indigo outline-none transition-colors placeholder:text-indigo/35 focus:border-gold aria-[invalid=true]:border-crimson aria-[invalid=true]:focus:border-crimson";

export function Field({
  id,
  label,
  jp,
  required,
  children,
}: {
  id: string;
  label: string;
  jp: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="ed-label"
      >
        <L ja={jp} en={label} />
        {required && (
          <span aria-hidden className="ml-1 text-crimson">
            *
          </span>
        )}
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
      className="ed-btn mt-2 w-full"
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
  // 枠も帯も作らない。入力欄のすぐ隣に出るので、色と字面だけで足りる
  const cls = tone === "error" ? "text-crimson" : "text-indigo";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`text-[12.5px] font-medium leading-[1.75] ${cls}`}
    >
      {children}
    </div>
  );
}

/**
 * レート制限に掛かったときの文言（`AuthErrorKey` の "rate"）。
 *
 * **なぜ試行が止まったのかを説明する。** 「失敗しました」とだけ出すと、
 * 正規のお客様がパスワードを疑って何度も試し、さらに待たされる。
 * 具体的な残り時間は出さない（攻撃側に窓の長さを教えることになるため）。
 */
export function RateLimitMessage() {
  return (
    <L
      en="Too many attempts from your connection. Please wait a few minutes and try again."
      ja="短時間に試行が集中したため、一時的に受け付けを止めています。数分おいてから、もう一度お試しください。"
    />
  );
}

export function OrDivider({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 py-1">
      <span aria-hidden className="ed-rule flex-1" />
      <span className="ed-label">{children}</span>
      <span aria-hidden className="ed-rule flex-1" />
    </div>
  );
}
