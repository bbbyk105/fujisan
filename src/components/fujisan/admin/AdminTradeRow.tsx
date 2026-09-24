"use client";

import { useState, useTransition } from "react";
import { adminReviewTradeAccountAction } from "@/lib/actions/admin-trade";
import {
  TRADE_BUSINESS_TYPE_LABELS,
  TRADE_REVIEW_NOTE_MAX,
  TRADE_STATUS_LABELS,
  type TradeBusinessType,
  type TradeStatus,
} from "@/data/fujisan-trade";
import { formatDateShortJp, formatDateTimeJp } from "@/lib/format-date";
import { useUnsavedChanges } from "@/lib/unsaved-changes";

const ERROR_MESSAGES: Record<string, string> = {
  unauth: "ログインが切れています。再度ログインしてください。",
  forbidden: "権限がありません。",
  invalid: "入力が不正です。",
  notfound: "このアカウントは見つかりませんでした。",
  db: "保存に失敗しました。時間をおいて再度お試しください。",
};

/** 未申請（行が無い）も含めた表示用の状態。 */
type DisplayStatus = TradeStatus | "none";

const STATUS_STYLE: Record<DisplayStatus, string> = {
  none: "border-indigo/30 bg-indigo/6 text-indigo/70",
  pending: "border-gold/60 bg-gold/12 text-gold-ink",
  approved: "border-moss/40 bg-moss/8 text-moss",
  rejected: "border-crimson/45 bg-crimson/8 text-crimson",
};

const STATUS_TEXT: Record<DisplayStatus, string> = {
  none: "未申請（旧アカウント）",
  pending: TRADE_STATUS_LABELS.pending.ja,
  approved: TRADE_STATUS_LABELS.approved.ja,
  rejected: TRADE_STATUS_LABELS.rejected.ja,
};

export type TradeAccountRow = {
  id: string;
  contactName: string;
  email: string;
  companyName: string | null;
  phone: string | null;
  address: string | null;
  emailVerified: boolean;
  createdAt: Date;
  tradeStatus: TradeStatus | null;
  businessType: TradeBusinessType | null;
  licenceNumber: string | null;
  reviewedAt: Date | null;
  reviewedByEmail: string | null;
  reviewNote: string | null;
};

/**
 * 取扱店アカウント 1 件の行。
 *
 * 承認するまで卸価格は表示されない。**見送りの理由はそのままお客様へのメールに
 * 載る**ので、入力欄のそばにその旨を書いておく。
 */
export function AdminTradeRow({ account }: { account: TradeAccountRow }) {
  const [status, setStatus] = useState<DisplayStatus>(
    account.tradeStatus ?? "none",
  );
  const [note, setNote] = useState(account.reviewNote ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // 見送りの理由は「見送る」を押したときにだけ送られる。書きかけで離れると消える
  useUnsavedChanges(note !== (account.reviewNote ?? ""));

  const review = (next: "approved" | "rejected") => {
    const previous = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      const res = await adminReviewTradeAccountAction({
        userId: account.id,
        status: next,
        note: next === "rejected" ? note : undefined,
      });
      if (!res.ok) {
        // 失敗したら表示を戻す（サーバーの状態と食い違わせない）。
        setStatus(previous);
        setError(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.db);
      }
    });
  };

  const typeLabel = account.businessType
    ? TRADE_BUSINESS_TYPE_LABELS[account.businessType].ja
    : null;

  return (
    <li className="border border-indigo/12 bg-white px-6 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className={`border px-2.5 py-1 text-[10px] font-semibold tracking-[0.2em] ${STATUS_STYLE[status]}`}
          >
            {STATUS_TEXT[status]}
          </span>
          <h2 className="font-serif text-[16px] font-semibold tracking-[0.04em] text-indigo">
            {account.companyName || "（会社名未登録）"}
          </h2>
          {typeLabel && (
            <span className="text-[11px] tracking-[0.12em] text-indigo/55">
              {typeLabel}
            </span>
          )}
        </div>
        <span
          className={`text-[10px] font-semibold tracking-[0.24em] ${
            account.emailVerified ? "text-moss" : "text-crimson"
          }`}
        >
          {account.emailVerified ? "メール認証済" : "メール未認証"}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="ご担当者" value={account.contactName} />
        <Field label="メール" value={account.email} />
        <Field label="電話" value={account.phone} />
        <Field label="ご登録" value={formatDateShortJp(account.createdAt)} />
        <Field label="酒類販売免許番号" value={account.licenceNumber} />
        <div className="sm:col-span-2 lg:col-span-3">
          <Field label="所在地" value={account.address} />
        </div>
      </dl>

      <div className="mt-5 border-t border-indigo/10 pt-4">
        {status === "approved" ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-[12px] text-indigo/70">
              承認済み。卸価格が表示されます。
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={() => review("rejected")}
              className="border border-crimson/45 px-4 py-2 text-[10.5px] font-semibold tracking-[0.24em] text-crimson hover:bg-crimson/8 disabled:opacity-60"
            >
              承認を取り消す
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <label
              htmlFor={`note-${account.id}`}
              className="text-[9.5px] font-semibold tracking-[0.28em] text-indigo/50"
            >
              見送りの理由（お客様へのメールにそのまま載ります）
            </label>
            <textarea
              id={`note-${account.id}`}
              value={note}
              maxLength={TRADE_REVIEW_NOTE_MAX}
              rows={2}
              onChange={(e) => setNote(e.target.value)}
              placeholder="例：酒類販売業免許の確認が取れなかったため"
              className="w-full border border-indigo/25 bg-white px-3 py-2 text-[12.5px] text-indigo outline-none focus:border-gold"
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={() => review("approved")}
                className="border border-indigo bg-indigo px-5 py-2 text-[10.5px] font-semibold tracking-[0.24em] text-paper-card hover:bg-indigo-lift disabled:opacity-60"
              >
                承認して口座を開く
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => review("rejected")}
                className="border border-crimson/45 px-5 py-2 text-[10.5px] font-semibold tracking-[0.24em] text-crimson hover:bg-crimson/8 disabled:opacity-60"
              >
                見送る
              </button>
              {pending && (
                <span className="text-[11px] text-indigo/55">保存中…</span>
              )}
            </div>
          </div>
        )}

        {account.reviewedByEmail && (
          <p className="mt-3 text-[11px] text-indigo/55">
            審査: {account.reviewedByEmail}
            {account.reviewedAt ? ` / ${formatDateTimeJp(account.reviewedAt)}` : ""}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-[12px] font-semibold text-crimson">
          {error}
        </p>
      )}
    </li>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[9.5px] font-semibold tracking-[0.28em] text-indigo/50">
        {label}
      </span>
      <span className="text-[13px] leading-[1.6] text-indigo/85">
        {value || "—"}
      </span>
    </div>
  );
}
