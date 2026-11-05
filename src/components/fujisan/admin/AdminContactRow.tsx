"use client";

import { useState, useTransition } from "react";
import {
  adminSetContactStatusAction,
  type AdminContactItem,
} from "@/lib/actions/admin-contacts";
import {
  CONTACT_STATUSES,
  CONTACT_STATUS_LABELS,
  CONTACT_SUBJECT_LABELS,
  type ContactStatus,
} from "@/data/fujisan-contact";
import { formatDateTimeJp } from "@/lib/format-date";
import { mailtoHref } from "@/lib/mailto";
import { useUnsavedChanges } from "@/lib/unsaved-changes";

const ERROR_MESSAGES: Record<string, string> = {
  unauth: "ログインが切れています。再度ログインしてください。",
  forbidden: "権限がありません。",
  invalid: "入力が不正です。",
  db: "保存に失敗しました。時間をおいて再度お試しください。",
  conflict: "ほかの管理者が先に更新しました。最新の状況を表示しています。",
};

/** 選んでいる状況の色。行を見渡したときに、未対応が見つかるようにする。 */
const STATUS_STYLE: Record<ContactStatus, string> = {
  new: "bg-crimson/8 font-semibold text-crimson",
  in_progress: "bg-gold/12 font-semibold text-gold-ink",
  done: "bg-moss/8 font-semibold text-moss",
};

/**
 * お問い合わせ 1 件の行。
 *
 * 受付の情報と対応状況を左に、お客様と本文を右に置く。対応するときは必ず本文を
 * 読むので、折りたたまない（対応済みは既定の一覧に出さない）。
 *
 * **対応状況は「保存」を押すまで保存しない。** 以前は select を切り替えた瞬間に
 * 保存していたため、選び間違えただけで「対応済み」になり、未対応の一覧から
 * 消えてしまうことがあった。管理画面の他のフォームとも作法を揃える。
 */
export function AdminContactRow({
  message,
  onDone,
  onConflict,
}: {
  message: AdminContactItem;
  /** 対応済みで保存できたとき。既定の一覧では、この行が消えるので結果を一覧に残す。 */
  onDone?: () => void;
  /** 先に更新されていたとき。その更新で行が消えることがあるので、これも一覧に残す。 */
  onConflict?: () => void;
}) {
  // 利用者が選んだ状況だけを持つ。触っていない行はサーバーの値にそのまま従う。
  const [picked, setPicked] = useState<ContactStatus | null>(null);
  // サーバーの値に追いついたら手放す。持ち続けると、次にほかの管理者が変えたときに
  // 触っていない行が未保存になる。
  if (picked === message.status) setPicked(null);
  const status = picked ?? message.status;
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const label = CONTACT_SUBJECT_LABELS[message.subject];
  const dirty = status !== message.status;
  useUnsavedChanges(dirty);

  const save = () => {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const res = await adminSetContactStatusAction({
        id: message.id,
        status,
        expectedStatus: message.status,
      });
      if (res.ok) {
        if (status === "done") onDone?.();
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        setError(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.db);
        if (res.error === "conflict") {
          // 古い選択を残すと、もう一度の保存で相手の更新を消してしまう。
          setPicked(null);
          onConflict?.();
        }
      }
    });
  };

  return (
    // 狭い画面では 受付 → 本文 → 対応状況 の順に積み、md 以上で対応状況を左の列へ送る。
    <li className="py-9 md:grid md:grid-cols-[208px_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:gap-x-14 md:py-10">
      <div className="text-[13px] leading-[1.8] text-indigo/65">
        <p className="font-semibold text-indigo">{label.ja}</p>
        <p className="tabular-nums">{formatDateTimeJp(message.createdAt)}</p>
        {message.locale === "en" && <p>英語のページから</p>}
      </div>

      <div className="mt-5 min-w-0 md:col-start-2 md:row-span-2 md:row-start-1 md:mt-0">
        <h2 className="font-serif text-[20px] font-medium leading-[1.4] text-indigo [overflow-wrap:anywhere]">
          {message.name}
        </h2>
        <p className="mt-1 text-[13px] text-indigo/65 [overflow-wrap:anywhere]">
          {message.email}
        </p>
        {/* 空白の無い長い文字列（URL など）で枠の外へはみ出さないよう、どこでも折り返す。 */}
        <p className="mt-5 max-w-[70ch] whitespace-pre-wrap text-[14.5px] leading-[1.95] text-indigo/88 [overflow-wrap:anywhere]">
          {message.message}
        </p>
        <a
          href={mailtoHref(
            message.email,
            `Re: ${message.locale === "en" ? label.en : label.ja} — FUJISAN SAKE`,
          )}
          className="mt-6 inline-flex min-h-[44px] items-center border border-indigo/30 px-5 text-[13px] font-semibold text-indigo no-underline transition-colors hover:border-indigo"
        >
          メールで返信
        </a>
      </div>

      <div className="mt-7 md:col-start-1 md:row-start-2 md:mt-6">
        <fieldset disabled={pending} className="disabled:opacity-60">
          <legend className="text-[13px] text-indigo/65">対応状況</legend>
          <div className="mt-2 grid grid-cols-3 divide-x divide-indigo/20 border border-indigo/20">
            {CONTACT_STATUSES.map((s) => (
              <label
                key={s}
                className={`flex min-h-[44px] cursor-pointer items-center justify-center text-[12.5px] transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold ${
                  status === s
                    ? STATUS_STYLE[s]
                    : "text-indigo/60 hover:text-indigo"
                }`}
              >
                <input
                  type="radio"
                  name={`status-${message.id}`}
                  value={s}
                  checked={status === s}
                  onChange={() => {
                    setPicked(s);
                    setError(null);
                    setSaved(false);
                  }}
                  className="sr-only"
                />
                {CONTACT_STATUS_LABELS[s]}
              </label>
            ))}
          </div>
        </fieldset>

        {dirty || pending ? (
          <button
            type="button"
            onClick={save}
            disabled={pending}
            className="mt-3 min-h-[44px] w-full border border-indigo bg-indigo px-5 text-[13px] font-semibold text-paper-card transition-colors hover:bg-indigo-lift disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "保存中…" : "保存"}
          </button>
        ) : null}
        {/* 読み上げに届くよう、知らせる領域は結果が出る前から置いておく。 */}
        <div role="status">
          {saved ? (
            <p className="mt-3 text-[12.5px] font-semibold text-moss">
              保存しました
            </p>
          ) : null}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-[12.5px] font-semibold text-crimson">
            {error}
          </p>
        )}
        {!dirty && message.status === "done" && message.handledByEmail && (
          <p className="mt-3 text-[12.5px] leading-[1.7] text-indigo/60 [overflow-wrap:anywhere]">
            {message.handledByEmail}
            {message.handledAt ? (
              <>
                <br />
                {formatDateTimeJp(message.handledAt)}
              </>
            ) : null}
          </p>
        )}
      </div>
    </li>
  );
}
