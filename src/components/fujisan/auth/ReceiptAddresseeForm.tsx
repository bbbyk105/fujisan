"use client";

import { useState, useTransition, type FormEvent } from "react";
import { setReceiptAddresseeAction } from "@/lib/actions/orders";
import { RECEIPT_ADDRESSEE_MAX } from "@/data/fujisan-orders";
import { L } from "@/i18n/Localized";
import { useUnsavedChanges } from "@/lib/unsaved-changes";

const ERRORS: Record<string, { ja: string; en: string }> = {
  unauth: {
    ja: "ログインが切れています。再度ログインしてください。",
    en: "Your session has expired. Please sign in again.",
  },
  not_found: {
    ja: "ご注文が見つかりません。",
    en: "Order not found.",
  },
  invalid: {
    ja: `宛名は改行なしの ${RECEIPT_ADDRESSEE_MAX} 文字以内でご入力ください。`,
    en: `Please use ${RECEIPT_ADDRESSEE_MAX} characters or fewer, on a single line.`,
  },
  db: {
    ja: "保存できませんでした。時間をおいて再度お試しください。",
    en: "We couldn't save that. Please try again.",
  },
};

/**
 * 領収書の宛名。
 *
 * 「上様」や正式社名を入れたい要望に応えるためのもの。印刷前にその場で
 * 直せるようにしつつ、**保存もする** — 再発行のたびに打ち直させないため。
 *
 * 画面でだけ出して印刷には出さない（`print:hidden`）。操作欄が書面に
 * 混ざると領収書として使えない。
 */
export function ReceiptAddresseeForm({
  orderRef,
  initial,
  fallbackName,
}: {
  orderRef: string;
  /** 保存済みの宛名。未設定なら null。 */
  initial: string | null;
  /** 未設定のときに使われる登録名（プレースホルダに出す）。 */
  fallbackName: string;
}) {
  const [value, setValue] = useState(initial ?? "");
  const [savedValue, setSavedValue] = useState(initial ?? "");
  const [saved, setSaved] = useState(false);
  useUnsavedChanges(value.trim() !== savedValue.trim());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await setReceiptAddresseeAction({
        orderRef,
        addressee: value,
      });
      if (res.ok) {
        setSavedValue(value);
        setSaved(true);
        window.setTimeout(() => setSaved(false), 2500);
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto mb-6 max-w-[760px] border border-indigo/15 bg-paper-card px-6 py-5 print:hidden"
    >
      <label
        htmlFor="receipt-addressee"
        className="text-[13px] text-indigo/70"
      >
        <L en="Addressee" ja="宛名" />
      </label>
      <p className="mt-2 text-[12px] leading-[1.75] text-indigo/70">
        <L
          en="Leave blank to use the name on your account. Common entries include a company's registered name."
          ja="空欄にすると登録名が使われます。正式社名や「上様」などをご指定いただけます。"
        />
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          id="receipt-addressee"
          type="text"
          value={value}
          maxLength={RECEIPT_ADDRESSEE_MAX}
          disabled={pending}
          onChange={(e) => setValue(e.target.value)}
          placeholder={fallbackName}
          className="min-w-[240px] flex-1 border-b border-indigo/25 bg-transparent py-2 text-[15px] text-indigo outline-none transition-colors placeholder:text-indigo/35 focus:border-gold disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending}
          className="ed-btn"
        >
          {pending ? (
            <L en="SAVING…" ja="保存中…" />
          ) : (
            <L en="Save" ja="保存する" />
          )}
        </button>
      </div>

      {saved && (
        <p role="status" className="mt-3 text-[12px] font-semibold text-moss">
          <L en="Saved." ja="保存しました。" />
        </p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-[12px] font-semibold text-crimson">
          <L
            ja={(ERRORS[error] ?? ERRORS.db).ja}
            en={(ERRORS[error] ?? ERRORS.db).en}
          />
        </p>
      )}
    </form>
  );
}
