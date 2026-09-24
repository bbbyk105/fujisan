"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { requestOrderCancellationAction } from "@/lib/actions/orders";
import { L } from "@/i18n/Localized";
import { useLocale } from "@/i18n/useLocale";
import { useUnsavedChanges } from "@/lib/unsaved-changes";

const ERRORS: Record<string, { ja: string; en: string }> = {
  unauth: {
    ja: "ログインが切れています。再度ログインしてください。",
    en: "Your session has expired. Please sign in again.",
  },
  not_found: {
    ja: "ご注文が見つかりませんでした。",
    en: "We couldn't find this order.",
  },
  not_cancellable: {
    ja: "このご注文は発送手配が進んでいるため、この画面からはキャンセルできません。お手数ですがお問い合わせください。",
    en: "This order has already moved to dispatch and can't be cancelled here. Please contact us.",
  },
  already: {
    ja: "すでにキャンセルのご依頼を承っています。",
    en: "We've already received your cancellation request.",
  },
  db: {
    ja: "処理に失敗しました。時間をおいて再度お試しください。",
    en: "Something went wrong. Please try again in a moment.",
  },
};

/**
 * キャンセル依頼ボタン。
 *
 * 押しただけで取り消されるのではなく「依頼」であることを、確認段階で明示する。
 * 返金は蔵側（owner）が確認してから実行するため、ここで金額は動かない。
 */
export function CancelOrderButton({ orderRef }: { orderRef: string }) {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  // 理由を書きかけのまま離れると、依頼は送られていない
  useUnsavedChanges(confirming && reason.trim() !== "");
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const locale = useLocale();

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await requestOrderCancellationAction({ orderRef, reason });
      if (res.ok) {
        setConfirming(false);
        router.refresh();
        return;
      }
      setError((ERRORS[res.error] ?? ERRORS.db)[locale === "en" ? "en" : "ja"]);
    });
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex cursor-pointer items-center justify-center gap-2 border-0 bg-transparent px-6 py-2 text-[11.5px] font-semibold tracking-[0.12em] text-indigo/60 underline decoration-indigo/25 underline-offset-4 transition-colors hover:text-crimson"
      >
        <L en="Request cancellation" ja="キャンセルを依頼する" />
      </button>
    );
  }

  return (
    <div className="border border-crimson/35 bg-crimson/[0.05] px-5 py-5">
      <p className="text-[12.5px] font-semibold leading-[1.7] text-crimson">
        <L
          en="Request cancellation of this order?"
          ja="このご注文のキャンセルを依頼しますか？"
        />
      </p>
      <p className="mt-2 text-[11.5px] leading-[1.75] text-indigo/78">
        <L
          en="We'll stop the dispatch and refund the full amount to your card. Our team confirms each request by hand, so the refund is not immediate. We'll email you once it's done."
          ja="発送を止め、カードへ全額をご返金いたします。ご依頼は担当が一件ずつ確認するため、返金は即時ではありません。完了しだいメールでお知らせします。"
        />
      </p>

      <label
        htmlFor={`cancel-reason-${orderRef}`}
        className="mt-4 block text-[11px] font-semibold tracking-[0.12em] text-indigo/60"
      >
        <L en="REASON (OPTIONAL)" ja="理由（任意）" />
      </label>
      <textarea
        id={`cancel-reason-${orderRef}`}
        rows={2}
        maxLength={500}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="mt-2 w-full resize-none border border-indigo/20 bg-white px-3 py-2 text-[12.5px] leading-[1.6] text-indigo outline-none focus:border-crimson"
        placeholder={
          locale === "ja" ? "差し支えなければお聞かせください" : "Optional"
        }
      />

      {error && (
        <p role="alert" className="mt-3 text-[12px] font-semibold text-crimson">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="inline-flex cursor-pointer items-center justify-center border border-crimson bg-crimson px-5 py-2.5 text-[11.5px] font-semibold tracking-[0.12em] text-white transition-colors hover:bg-crimson-deep disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? (
            <L en="Sending…" ja="送信中…" />
          ) : (
            <L en="Send request" ja="依頼する" />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={pending}
          className="cursor-pointer text-[11px] tracking-[0.18em] text-indigo/60 transition-colors hover:text-indigo disabled:opacity-60"
        >
          <L en="Keep my order" ja="やめる" />
        </button>
      </div>
    </div>
  );
}
