"use client";

import { useState, useTransition } from "react";
import { adminSetContactStatusAction } from "@/lib/actions/admin-contacts";
import {
  CONTACT_STATUS_LABELS,
  CONTACT_SUBJECT_LABELS,
  type ContactStatus,
  type ContactSubject,
} from "@/data/fujisan-contact";

const ERROR_MESSAGES: Record<string, string> = {
  unauth: "ログインが切れています。再度ログインしてください。",
  forbidden: "権限がありません。",
  invalid: "入力が不正です。",
  db: "保存に失敗しました。時間をおいて再度お試しください。",
};

const STATUS_STYLE: Record<ContactStatus, string> = {
  new: "border-[#8B1A1A]/45 bg-[#8B1A1A]/8 text-[#8B1A1A]",
  in_progress: "border-[#C9A84C]/60 bg-[#C9A84C]/12 text-[#8A6F1E]",
  done: "border-[#2F5A2F]/40 bg-[#2F5A2F]/8 text-[#2F5A2F]",
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

function fmtDateTime(d: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

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
    <li className="border border-[#0B1A2E]/12 bg-white px-6 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span
            className={`border px-2.5 py-1 text-[10px] font-semibold tracking-[0.2em] ${STATUS_STYLE[status]}`}
          >
            {CONTACT_STATUS_LABELS[status]}
          </span>
          <h2 className="font-serif text-[16px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
            {message.name}
          </h2>
          <span className="text-[11px] tracking-[0.12em] text-[#0B1A2E]/55">
            {label.ja}
            {message.locale === "en" && (
              <span className="ml-2 text-[#C9A84C]">EN</span>
            )}
          </span>
        </div>
        <span className="text-[11px] tabular-nums text-[#0B1A2E]/55">
          {fmtDateTime(message.createdAt)}
        </span>
      </div>

      <p className="mt-3 text-[12.5px] text-[#0B1A2E]/80">
        <a
          href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${label.ja} — FUJISAN SAKE`)}`}
          className="underline decoration-[#0B1A2E]/25 underline-offset-2 hover:text-[#C9A84C]"
        >
          {message.email}
        </a>
      </p>

      <details className="group mt-4">
        <summary className="cursor-pointer list-none text-[11px] font-semibold tracking-[0.22em] text-[#0B1A2E]/65 hover:text-[#0B1A2E] [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">本文を開く ＋</span>
          <span className="hidden group-open:inline">本文を閉じる −</span>
        </summary>
        <div className="mt-3 whitespace-pre-wrap border-l-2 border-[#C9A84C]/60 bg-[#F7F1E3]/60 px-4 py-3 text-[13px] leading-[1.85] text-[#0B1A2E]/88">
          {message.message}
        </div>
      </details>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#0B1A2E]/10 pt-4">
        <label
          htmlFor={`status-${message.id}`}
          className="text-[9.5px] font-semibold tracking-[0.28em] text-[#0B1A2E]/50"
        >
          対応状況
        </label>
        <select
          id={`status-${message.id}`}
          value={status}
          disabled={pending}
          onChange={(e) => change(e.target.value as ContactStatus)}
          className="border border-[#0B1A2E]/25 bg-white px-3 py-2 text-[12.5px] text-[#0B1A2E] outline-none focus:border-[#C9A84C] disabled:opacity-60"
        >
          <option value="new">未対応</option>
          <option value="in_progress">対応中</option>
          <option value="done">対応済み</option>
        </select>
        {pending && (
          <span className="text-[11px] text-[#0B1A2E]/55">保存中…</span>
        )}
        {status === "done" && message.handledByEmail && (
          <span className="text-[11px] text-[#0B1A2E]/55">
            {message.handledByEmail}
            {message.handledAt ? ` / ${fmtDateTime(message.handledAt)}` : ""}
          </span>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-[12px] font-semibold text-[#8B1A1A]">
          {error}
        </p>
      )}
    </li>
  );
}
