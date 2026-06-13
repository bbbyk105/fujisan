"use client";

import { useState } from "react";
import { deleteAccountAction } from "@/lib/actions/auth";
import { L } from "@/i18n/Localized";

const CONFIRM_PHRASE = "退会する";

/**
 * 退会フロー。
 * 1. 「退会する」ボタンを押すと確認パネルが開く
 * 2. 確認フレーズ（"退会する"）を入力 + チェックを入れて初めて削除可能
 * 3. 削除後はフルリロードでセッション表示を同期しつつトップへ
 */
export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    open && phrase.trim() === CONFIRM_PHRASE && agreed && !loading;

  const reset = () => {
    setPhrase("");
    setAgreed(false);
    setError(null);
  };

  const handleDelete = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    const res = await deleteAccountAction();
    if (!res.ok) {
      setLoading(false);
      setError("delete-failed");
      return;
    }
    window.location.href = "/";
  };

  if (!open) {
    return (
      <div className="border-t border-[#8B1A1A]/25 pt-8">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#8B1A1A]/80">
            DELETE ACCOUNT
          </span>
          <span className="h-px w-8 bg-[#8B1A1A]/40" />
          <span className="font-jp text-[11px] tracking-[0.26em] text-[#8B1A1A]/85">
            退会について
          </span>
        </div>
        <p className="mt-4 max-w-[60ch] text-[12.5px] leading-[1.75] text-[#1D2432]/72">
          <L
            en="Deleting your account removes your registration, sessions, and connected providers. This action cannot be undone."
            ja="退会すると、ご登録情報・ログインセッション・連携アカウントがすべて削除され、元に戻すことはできません。"
          />
        </p>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(true);
          }}
          className="group/del mt-5 inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-[10.5px] font-semibold tracking-[0.34em] text-[#8B1A1A]"
        >
          <span className="relative pb-1">
            <L en="DELETE MY ACCOUNT" ja="退会する" />
            <span className="absolute inset-x-0 -bottom-0 h-px bg-[#8B1A1A]/50 transition-all duration-500 group-hover/del:bg-[#8B1A1A]" />
          </span>
          <span
            aria-hidden
            className="transition-transform duration-500 group-hover/del:translate-x-1"
          >
            →
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-[#8B1A1A]/25 pt-8">
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#8B1A1A]/80">
          CONFIRM DELETION
        </span>
        <span className="h-px w-8 bg-[#8B1A1A]/40" />
        <span className="font-jp text-[11px] tracking-[0.26em] text-[#8B1A1A]/85">
          最終確認
        </span>
      </div>

      <div className="mt-5 border border-[#8B1A1A]/35 bg-[#8B1A1A]/[0.05] px-5 py-5">
        <p className="text-[12.5px] leading-[1.75] text-[#0B1A2E]">
          <L
            en={
              <>
                Type <strong className="font-semibold">{CONFIRM_PHRASE}</strong>{" "}
                to confirm. Your account, sessions, and linked providers will be
                permanently deleted.
              </>
            }
            ja={
              <>
                確認のため、下の欄に <strong className="font-semibold">「{CONFIRM_PHRASE}」</strong>{" "}
                とご入力ください。アカウント・セッション・連携情報はすべて完全に削除されます。
              </>
            }
          />
        </p>

        <input
          type="text"
          autoComplete="off"
          value={phrase}
          onChange={(e) => setPhrase(e.target.value)}
          placeholder={CONFIRM_PHRASE}
          className="mt-4 w-full border-b border-[#8B1A1A]/40 bg-transparent py-2.5 text-[15px] text-[#0B1A2E] outline-none transition-colors placeholder:text-[#0B1A2E]/30 focus:border-[#8B1A1A]"
        />

        <label className="mt-4 flex cursor-pointer items-start gap-3 text-[12px] leading-[1.6] text-[#0B1A2E]/85">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-[3px] h-3.5 w-3.5 cursor-pointer accent-[#8B1A1A]"
          />
          <span>
            <L
              en="I understand this action is permanent and cannot be undone."
              ja="この操作は取り消しできず、データは完全に削除されることを理解しました。"
            />
          </span>
        </label>

        {error && (
          <p
            role="alert"
            className="mt-4 text-[12.5px] leading-[1.65] text-[#8B1A1A]"
          >
            <L
              en="Could not delete your account. Please try again."
              ja="退会処理を完了できませんでした。再度お試しください。"
            />
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleDelete}
            className="inline-flex cursor-pointer items-center justify-center gap-3 border border-[#8B1A1A] bg-[#8B1A1A] px-6 py-3 text-[10.5px] font-semibold tracking-[0.3em] text-paper-card transition-colors hover:bg-[#741515] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <L en="DELETING…" ja="退会処理中…" />
            ) : (
              <L en="PERMANENTLY DELETE" ja="退会を確定する" />
            )}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setOpen(false);
              reset();
            }}
            className="inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-[10.5px] font-semibold tracking-[0.3em] text-[#0B1A2E]/75 hover:text-[#0B1A2E] disabled:opacity-50"
          >
            <L en="CANCEL" ja="キャンセル" />
          </button>
        </div>
      </div>
    </div>
  );
}
