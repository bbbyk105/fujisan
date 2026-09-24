"use client";

import { useState, type FormEvent } from "react";
import { changeMyPasswordAction } from "@/lib/actions/auth";
import type { AuthErrorKey } from "@/lib/auth-errors";
import { FieldError } from "@/components/fujisan/FieldError";
import type { FieldErrorKey } from "@/lib/validation/forms";
import { L } from "@/i18n/Localized";
import { RateLimitMessage } from "./ui";
import { useUnsavedChanges } from "@/lib/unsaved-changes";

const inputCls =
  "w-full border-b border-indigo/25 bg-transparent py-2.5 text-[15px] text-indigo outline-none transition-colors placeholder:text-indigo/35 focus:border-gold aria-[invalid=true]:border-crimson";

/**
 * ログイン中のパスワード変更。
 *
 * 以前はログアウトして「パスワードをお忘れの方」からメールを受け取るしか
 * 手段が無かった。ここでは現在のパスワードの確認を必須にし、成功したら
 * 他端末のセッションを失効させる（サーバーアクション側で実施）。
 */
export function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, FieldErrorKey>
  >({});
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  useUnsavedChanges(current !== "" || next !== "" || confirm !== "");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorKey(null);
    setMismatch(false);
    setDone(false);

    const errors: Record<string, FieldErrorKey> = {};
    if (!current) errors.current = "required";
    if (!next) errors.next = "required";
    else if (next.length < 8) errors.next = "min8";
    // 確認欄の不一致は「必須」ではないので、専用の文言を下に出す
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // 確認入力の不一致はクライアント側で分かる。サーバーの
    // 「現在のパスワードが違う」と混ぜず、専用の文言で返す。
    if (next !== confirm) {
      setMismatch(true);
      return;
    }

    setSubmitting(true);
    const res = await changeMyPasswordAction({
      currentPassword: current,
      newPassword: next,
    });
    setSubmitting(false);

    if (res.ok) {
      setCurrent("");
      setNext("");
      setConfirm("");
      setFieldErrors({});
      setMismatch(false);
      setDone(true);
      return;
    }
    setErrorKey(res.error);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="border-t border-indigo/15 pt-8"
    >
      <h3 className="font-serif text-[18px] font-medium text-indigo">
        <L en="Change password" ja="パスワードの変更" />
      </h3>
      <p className="mt-3 max-w-[62ch] text-[14px] leading-[1.9] text-indigo/75">
        <L
          en="Enter your current password to set a new one. For your safety, changing it signs you out on every other device."
          ja="現在のパスワードをご確認のうえ、新しいパスワードを設定してください。安全のため、変更すると他の端末のログインはすべて解除されます。"
        />
      </p>

      {done && (
        <p
          role="status"
          className="mt-5 text-[13.5px] leading-[1.8] text-moss"
        >
          <L
            en="Your password has been changed. Other devices have been signed out."
            ja="パスワードを変更しました。他の端末のログインは解除されています。"
          />
        </p>
      )}

      {mismatch && (
        <p
          role="alert"
          className="mt-5 text-[13.5px] font-medium leading-[1.8] text-crimson"
        >
          <L
            en="The two new password fields don't match."
            ja="新しいパスワードの確認入力が一致していません。"
          />
        </p>
      )}

      {errorKey && (
        <p
          role="alert"
          className="mt-5 text-[13.5px] font-medium leading-[1.8] text-crimson"
        >
          {errorKey === "rate" ? (
            <RateLimitMessage />
          ) : errorKey === "weak" ? (
            <L
              en="The new password must be at least 8 characters."
              ja="新しいパスワードは8文字以上で設定してください。"
            />
          ) : errorKey === "too-long" ? (
            <L
              en="The new password is too long. Please use 128 characters or fewer."
              ja="新しいパスワードが長すぎます。128文字以内で設定してください。"
            />
          ) : errorKey === "no-password" ? (
            <L
              en="This account signs in with Google, so it has no password to change. You can manage it from your Google account."
              ja="このアカウントは Google ログインでご利用中のため、変更できるパスワードがありません。Google アカウント側でご管理ください。"
            />
          ) : errorKey === "invalid" ? (
            <L
              en="Your current password isn't correct."
              ja="現在のパスワードが正しくありません。"
            />
          ) : (
            <L
              en="We couldn't change your password. Please try again."
              ja="パスワードを変更できませんでした。もう一度お試しください。"
            />
          )}
        </p>
      )}

      <div className="mt-7 flex max-w-[420px] flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="current-password"
            className="text-[13px] text-indigo/70"
          >
            <L en="Current password" ja="現在のパスワード" />
          </label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(fieldErrors.current)}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className={inputCls}
            placeholder="••••••••"
          />
          <FieldError error={fieldErrors.current} />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="new-password"
            className="text-[13px] text-indigo/70"
          >
            <L en="New password" ja="新しいパスワード" />
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(fieldErrors.next)}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={inputCls}
            placeholder="8文字以上"
          />
          <FieldError error={fieldErrors.next} />
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="confirm-password"
            className="text-[13px] text-indigo/70"
          >
            <L en="Confirm new password" ja="新しいパスワード（確認）" />
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(fieldErrors.confirm)}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="ed-btn mt-8"
      >
        {submitting ? (
          <L en="SAVING…" ja="変更中…" />
        ) : (
          <L en="Change password" ja="パスワードを変更する" />
        )}
      </button>
    </form>
  );
}
