"use client";

import { useState, type FormEvent } from "react";
import { changeMyPasswordAction } from "@/lib/actions/auth";
import type { AuthErrorKey } from "@/lib/auth-errors";
import { FieldError } from "@/components/fujisan/FieldError";
import type { FieldErrorKey } from "@/lib/validation/forms";
import { L } from "@/i18n/Localized";

const inputCls =
  "w-full border-b border-[#0B1A2E]/25 bg-transparent py-2.5 text-[15px] text-[#0B1A2E] outline-none transition-colors placeholder:text-[#0B1A2E]/35 focus:border-[#C9A84C] aria-[invalid=true]:border-[#8B1A1A]";

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
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorKey(null);
    setDone(false);

    const errors: Record<string, FieldErrorKey> = {};
    if (!current) errors.current = "required";
    if (!next) errors.next = "required";
    else if (next.length < 8) errors.next = "min8";
    // 確認欄の不一致は「必須」ではないので、専用の文言を下に出す
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (next !== confirm) {
      setErrorKey("invalid");
      setFieldErrors({ confirm: "required" });
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
      setDone(true);
      return;
    }
    setErrorKey(res.error);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="border border-[#0B1A2E]/12 bg-paper/65 px-7 py-8 md:px-10 md:py-10"
    >
      <h3 className="font-serif text-[16px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
        <L en="Change password" ja="パスワードの変更" />
      </h3>
      <p className="mt-3 max-w-[60ch] text-[12.5px] leading-[1.75] text-[#1D2432]/72">
        <L
          en="Enter your current password to set a new one. For your safety, changing it signs you out on every other device."
          ja="現在のパスワードをご確認のうえ、新しいパスワードを設定してください。安全のため、変更すると他の端末のログインはすべて解除されます。"
        />
      </p>

      {done && (
        <p
          role="status"
          className="mt-5 border border-[#5C8A5C]/45 bg-[#5C8A5C]/[0.08] px-4 py-3 text-[12.5px] leading-[1.7] text-[#2F5A2F]"
        >
          <L
            en="Your password has been changed. Other devices have been signed out."
            ja="パスワードを変更しました。他の端末のログインは解除されています。"
          />
        </p>
      )}

      {errorKey && (
        <p
          role="alert"
          className="mt-5 border border-[#8B1A1A]/40 bg-[#8B1A1A]/[0.06] px-4 py-3 text-[12.5px] leading-[1.7] text-[#8B1A1A]"
        >
          {errorKey === "weak" ? (
            <L
              en="The new password must be at least 8 characters."
              ja="新しいパスワードは8文字以上で設定してください。"
            />
          ) : errorKey === "invalid" ? (
            <L
              en="Please check your current password and that both new password fields match."
              ja="現在のパスワード、および新しいパスワードの確認入力をご確認ください。"
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
            className="text-[10px] font-semibold tracking-[0.28em] text-[#0B1A2E]/60"
          >
            <L en="CURRENT PASSWORD" ja="現在のパスワード" />
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
            className="text-[10px] font-semibold tracking-[0.28em] text-[#0B1A2E]/60"
          >
            <L en="NEW PASSWORD" ja="新しいパスワード" />
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
            className="text-[10px] font-semibold tracking-[0.28em] text-[#0B1A2E]/60"
          >
            <L en="CONFIRM NEW PASSWORD" ja="新しいパスワード（確認）" />
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
        className="mt-8 inline-flex cursor-pointer items-center justify-center border border-[#0B1A2E] bg-[#0B1A2E] px-7 py-3.5 text-[10.5px] font-semibold tracking-[0.28em] text-paper-card transition-colors hover:bg-[#1D2432] disabled:cursor-wait disabled:opacity-60"
      >
        {submitting ? (
          <L en="SAVING…" ja="変更中…" />
        ) : (
          <L en="CHANGE PASSWORD" ja="パスワードを変更する" />
        )}
      </button>
    </form>
  );
}
