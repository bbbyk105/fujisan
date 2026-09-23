"use client";

import { useState, useTransition } from "react";
import { adminSetContactStatusAction } from "@/lib/actions/admin-contacts";
import {
  CONTACT_STATUS_LABELS,
  CONTACT_SUBJECT_LABELS,
  type ContactStatus,
  type ContactSubject,
} from "@/data/fujisan-contact";
import { formatDateTimeJp } from "@/lib/format-date";

const ERROR_MESSAGES: Record<string, string> = {
  unauth: "ログインが切れています。再度ログインしてください。",
  forbidden: "権限がありません。",
  invalid: "入力が不正です。",
  db: "保存に失敗しました。時間をおいて再度お試しください。",
};

const STATUS_STYLE: Record<ContactStatus, string> = {
  new: "border-crimson/45 bg-crimson/8 text-crimson",
  in_progress: "border-gold/60 bg-gold/12 text-gold-ink",
  done: "border-moss/40 bg-moss/8 text-moss",
};

type Message = {
  id: string;
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
  locale: string;
  status: ContactStatus;
  handledByEmail: string | null;
  handledAt: Date | null;
  createdAt: Date;
};

/**
 * お問い合わせ 1 件の行。
 * 本文は既定で折りたたみ、対応状況は select ですぐ切り替えられるようにする
 * （日々の運用では「未対応を拾って返信し、対応済みにする」の反復になるため）。
 */
export function AdminContactRow({ message }: { message: Message }) {
  const [status, setStatus] = useState<ContactStatus>(message.status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const label = CONTACT_SUBJECT_LABELS[message.subject];

  const change = (next: ContactStatus) => {
    const previous = status;
    setStatus(next);
    setError(null);
    startTransition(async () => {
      const res = await adminSetContactStatusAction({ id: message.id, status: next });
      if (!res.ok) {
        // 失敗したら表示を元に戻す（サーバーの状態と食い違わせない）。
        setStatus(previous);
        setError(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.db);
      }
    });
  };

  return (
    <li className="border border-indigo/12 bg-white px-6 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className={`border px-2.5 py-1 text-[10px] font-semibold tracking-[0.2em] ${STATUS_STYLE[status]}`}
          >
            {CONTACT_STATUS_LABELS[status]}
          </span>
          <h2 className="font-serif text-[16px] font-semibold tracking-[0.04em] text-indigo">
            {message.name}
          </h2>
          <span className="text-[11px] tracking-[0.12em] text-indigo/55">
            {label.ja}
            {message.locale === "en" && (
              <span className="ml-2 text-gold">EN</span>
            )}
          </span>
        </div>
        <span className="text-[11px] tabular-nums text-indigo/55">
          {formatDateTimeJp(message.createdAt)}
        </span>
      </div>

      <p className="mt-3 text-[12.5px] text-indigo/80">
        <a
          href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${label.ja} — FUJISAN SAKE`)}`}
          className="underline decoration-indigo/25 underline-offset-2 hover:text-gold"
        >
          {message.email}
        </a>
      </p>

      <details className="group mt-4">
        <summary className="cursor-pointer list-none text-[11px] font-semibold tracking-[0.22em] text-indigo/65 hover:text-indigo [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">本文を開く ＋</span>
          <span className="hidden group-open:inline">本文を閉じる −</span>
        </summary>
        <div className="mt-3 whitespace-pre-wrap border-l-2 border-gold/60 bg-paper-card/60 px-4 py-3 text-[13px] leading-[1.85] text-indigo/88">
          {message.message}
        </div>
      </details>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-indigo/10 pt-4">
        <label
          htmlFor={`status-${message.id}`}
          className="text-[9.5px] font-semibold tracking-[0.28em] text-indigo/50"
        >
          対応状況
        </label>
        <select
          id={`status-${message.id}`}
          value={status}
          disabled={pending}
          onChange={(e) => change(e.target.value as ContactStatus)}
          className="border border-indigo/25 bg-white px-3 py-2 text-[12.5px] text-indigo outline-none focus:border-gold disabled:opacity-60"
        >
          <option value="new">未対応</option>
          <option value="in_progress">対応中</option>
          <option value="done">対応済み</option>
        </select>
        {pending && (
          <span className="text-[11px] text-indigo/55">保存中…</span>
        )}
        {status === "done" && message.handledByEmail && (
          <span className="text-[11px] text-indigo/55">
            {message.handledByEmail}
            {message.handledAt ? ` / ${formatDateTimeJp(message.handledAt)}` : ""}
          </span>
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
