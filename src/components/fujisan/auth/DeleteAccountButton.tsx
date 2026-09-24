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
      setError(res.error === "active-orders" ? "active-orders" : "delete-failed");
      return;
    }
    window.location.href = "/";
  };

  if (!open) {
    return (
      <div className="border-t border-crimson/25 pt-8">
        <h3 className="font-serif text-[18px] font-medium text-crimson">
          <L en="Delete account" ja="退会" />
        </h3>
        <p className="mt-3 max-w-[62ch] text-[14px] leading-[1.9] text-indigo/75">
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
          className="group/del mt-5 inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-[13.5px] font-semibold text-crimson"
        >
          <span className="relative pb-1">
            <L en="Delete my account" ja="退会する" />
            <span className="absolute inset-x-0 -bottom-0 h-px bg-crimson/50 transition-all duration-500 group-hover/del:bg-crimson" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-crimson/25 pt-8">
      <h3 className="font-serif text-[18px] font-medium text-crimson">
        <L en="Confirm deletion" ja="退会の最終確認" />
      </h3>

      <div className="mt-5 border border-crimson/35 bg-crimson/[0.05] px-5 py-5">
        <p className="text-[14px] leading-[1.85] text-indigo">
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
          className="mt-4 w-full border-b border-crimson/40 bg-transparent py-2.5 text-[15px] text-indigo outline-none transition-colors placeholder:text-indigo/30 focus:border-crimson"
        />

        <label className="mt-4 flex cursor-pointer items-start gap-3 text-[13.5px] leading-[1.7] text-indigo/85">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-[3px] h-3.5 w-3.5 cursor-pointer accent-crimson"
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
            className="mt-4 text-[13.5px] leading-[1.8] text-crimson"
          >
            {error === "active-orders" ? (
              <L
                en="You have an order still on its way. Account deletion becomes available once every order has been delivered."
                ja="お届けが完了していないご注文があるため、いまは退会できません。すべてのご注文のお届け完了後に、あらためてお手続きください。"
              />
            ) : (
              <L
                en="Could not delete your account. Please try again."
                ja="退会処理を完了できませんでした。再度お試しください。"
              />
            )}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleDelete}
            className="inline-flex cursor-pointer items-center justify-center gap-3 border border-crimson bg-crimson px-6 py-3 text-[13.5px] font-semibold text-paper-card transition-colors hover:bg-crimson-deep disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <L en="Deleting…" ja="退会処理中…" />
            ) : (
              <L en="Permanently delete" ja="退会を確定する" />
            )}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setOpen(false);
              reset();
            }}
            className="inline-flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 text-[13.5px] text-indigo/75 underline decoration-indigo/25 underline-offset-4 hover:text-indigo disabled:opacity-50"
          >
            <L en="Cancel" ja="キャンセル" />
          </button>
        </div>
      </div>
    </div>
  );
}
