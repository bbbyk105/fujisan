"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  adminReplyContactAction,
  type AdminContactItem,
} from "@/lib/actions/admin-contacts";
import { CONTACT_REPLY_MAX } from "@/data/fujisan-contact";
import { FUJISAN_LEGAL } from "@/data/fujisan-legal";
import { formatDateTimeJp } from "@/lib/format-date";
import { useUnsavedChanges } from "@/lib/unsaved-changes";

const COPY_LABELS = {
  idle: "アドレスをコピー",
  copied: "コピーしました",
  failed: "コピーできませんでした",
};

const SEND_ERRORS: Record<string, string> = {
  unauth: "ログインが切れています。再度ログインしてください。",
  forbidden: "権限がありません。",
  invalid: "本文を確認してください。",
  gone: "このお問い合わせは削除されています。",
  conflict: "ほかの管理者が先に返信しました。送信した返信を確認してください。",
  send: "送信できませんでした。時間をおいて再度お試しください。",
  db: "送信できませんでした。時間をおいて再度お試しください。",
};

/** 応答が返らなかったとき。届いている可能性があるので、再送を勧めない。 */
const SEND_UNKNOWN =
  "送信できたか確認できませんでした。再読み込みして、送信した返信を確認してください。";

const SENT_LABELS = {
  sent: "送信しました",
  unrecorded:
    "送信しましたが、記録に失敗しました。同じ内容を再送しないでください。",
};

/**
 * お問い合わせへの返信。送った返信の一覧と入力欄。
 *
 * **返信を mailto: にしない。** 開き先は端末の設定で決まり、ブラウザが受け取ると
 * 何も起きない（2026-11-05 に本番で発生）。Gmail の作成画面を開く形も、差出人が
 * Gmail のアドレスになるのでやめた。サーバーから `info@` で送る。
 * 手元のメールソフトで書く人のために、アドレスのコピーは残してある。
 *
 * 送ったメールは取り消せないので、送信の前に宛先を見せて確認する。
 */
export function AdminContactReply({
  message,
  onDraftChange,
}: {
  message: AdminContactItem;
  /** 書きかけの有無。行の保存で確認を挟むのに使う。 */
  onDraftChange?: (hasDraft: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<keyof typeof SENT_LABELS | null>(null);
  const [pending, startTransition] = useTransition();
  const [copyState, setCopyState] = useState<keyof typeof COPY_LABELS>("idle");
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const hasDraft = draft.trim() !== "";
  useUnsavedChanges(hasDraft);
  useEffect(() => {
    onDraftChange?.(hasDraft);
  }, [hasDraft, onDraftChange]);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(message.email);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState("idle"), 2500);
  };

  const close = () => {
    if (hasDraft && !window.confirm("書きかけの返信を破棄しますか？")) return;
    setDraft("");
    setError(null);
    setOpen(false);
  };

  const send = () => {
    const ok = window.confirm(
      `${message.email} へ返信を送信します。\n送信すると取り消せません。よろしいですか？`,
    );
    if (!ok) return;
    setError(null);
    setSent(null);
    startTransition(async () => {
      try {
        const res = await adminReplyContactAction({
          id: message.id,
          body: draft,
          expectedReplies: message.replies.length,
        });
        if (res.ok) {
          setDraft("");
          setOpen(false);
          setSent(res.recorded ? "sent" : "unrecorded");
        } else {
          setError(SEND_ERRORS[res.error] ?? SEND_ERRORS.send);
        }
      } catch {
        // 例外のままにすると画面ごとエラー表示に変わり、書いた本文が消える。
        setError(SEND_UNKNOWN);
      }
    });
  };

  return (
    <>
      {message.replies.length > 0 && (
        <div className="mt-7 max-w-[70ch] border-t border-indigo/12 pt-5">
          <h3 className="text-[13px] text-indigo/65">送信した返信</h3>
          <ul className="mt-3 flex flex-col gap-5">
            {message.replies.map((reply) => (
              <li key={reply.id}>
                <p className="text-[12.5px] tabular-nums text-indigo/60 [overflow-wrap:anywhere]">
                  {formatDateTimeJp(reply.createdAt)}
                  <span aria-hidden className="mx-2 text-indigo/30">
                    ／
                  </span>
                  {reply.sentByEmail}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-[1.9] text-indigo/88 [overflow-wrap:anywhere]">
                  {reply.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {open ? (
        <div className="mt-7 max-w-[70ch]">
          <label
            htmlFor={`reply-${message.id}`}
            className="text-[13px] text-indigo/65"
          >
            返信の本文
          </label>
          <textarea
            id={`reply-${message.id}`}
            value={draft}
            disabled={pending}
            maxLength={CONTACT_REPLY_MAX}
            rows={8}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            className="mt-2 block w-full border border-indigo/25 bg-white px-3 py-2.5 text-[14px] leading-[1.9] text-indigo outline-none focus:border-gold disabled:opacity-60"
          />
          <p className="mt-2 text-[12.5px] leading-[1.7] text-indigo/60">
            宛名、いただいた内容の引用、販売者の表記は自動で入ります。
            {FUJISAN_LEGAL.email} から送信します。
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <button
              type="button"
              onClick={send}
              disabled={pending || !hasDraft}
              className="min-h-[44px] border border-indigo bg-indigo px-6 text-[13px] font-semibold text-paper-card transition-colors hover:bg-indigo-lift disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pending ? "送信中…" : "送信"}
            </button>
            <button
              type="button"
              onClick={close}
              disabled={pending}
              className="min-h-[44px] text-[13px] text-indigo/65 underline decoration-indigo/25 underline-offset-4 transition-colors hover:text-indigo"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button
            type="button"
            onClick={() => {
              setSent(null);
              setOpen(true);
            }}
            className="inline-flex min-h-[44px] items-center border border-indigo/30 px-5 text-[13px] font-semibold text-indigo transition-colors hover:border-indigo"
          >
            返信を書く
          </button>
          <button
            type="button"
            onClick={copyEmail}
            aria-live="polite"
            className="min-h-[44px] text-[13px] text-indigo/65 underline decoration-indigo/25 underline-offset-4 transition-colors hover:text-indigo"
          >
            {COPY_LABELS[copyState]}
          </button>
        </div>
      )}

      <div role="status">
        {sent && (
          <p
            className={`mt-3 text-[12.5px] font-semibold ${
              sent === "sent" ? "text-moss" : "text-crimson"
            }`}
          >
            {SENT_LABELS[sent]}
          </p>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 text-[12.5px] font-semibold text-crimson">
          {error}
        </p>
      )}
    </>
  );
}
