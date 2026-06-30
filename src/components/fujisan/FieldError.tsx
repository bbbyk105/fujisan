import { L } from "@/i18n/Localized";
import type { FieldErrorKey } from "@/lib/validation/forms";

const MESSAGES: Record<FieldErrorKey, { en: string; ja: string }> = {
  required: { en: "This field is required.", ja: "入力してください。" },
  email: {
    en: "Enter a valid email address.",
    ja: "メールアドレスの形式が正しくありません。",
  },
  min8: {
    en: "Must be at least 8 characters.",
    ja: "8文字以上で入力してください。",
  },
  url: {
    en: "Enter a valid URL (https://…).",
    ja: "URL の形式が正しくありません（https://…）。",
  },
  agree: {
    en: "Please confirm to continue.",
    ja: "ご確認のうえチェックしてください。",
  },
  postal: {
    en: "Enter a valid Japanese postal code (e.g. 417-0051). We ship within Japan only.",
    ja: "日本の郵便番号（例: 417-0051）を入力してください。発送は日本国内のみです。",
  },
};

/** バリデーションエラーキーを日英でインライン表示する。error が無ければ何も描画しない。 */
export function FieldError({ error }: { error?: FieldErrorKey }) {
  if (!error) return null;
  const m = MESSAGES[error];
  return (
    <p
      role="alert"
      className="mt-1.5 text-[11.5px] leading-[1.5] text-[#8B1A1A]"
    >
      <L en={m.en} ja={m.ja} />
    </p>
  );
}
