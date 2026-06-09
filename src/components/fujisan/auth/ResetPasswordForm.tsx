"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { resetPasswordAction } from "@/lib/actions/auth";
import type { AuthErrorKey } from "@/lib/auth-errors";
import {
  getFieldErrors,
  resetPasswordSchema,
  type FieldErrorKey,
} from "@/lib/validation/forms";
import { FieldError } from "@/components/fujisan/FieldError";
import { scrollToFirstError } from "@/lib/scrollToFirstError";
import { L } from "@/i18n/Localized";
import { Field, inputCls, PrimaryButton, Notice } from "./ui";

export function ResetPasswordForm({
  role,
}: {
  role: "personal" | "business";
}) {
  const params = useSearchParams();
  // better-auth のコールバックが ?token=... を付与してこのページへ遷移させる。
  // トークン不正時は ?error=... が付く。
  const token = params.get("token") ?? "";
  const linkError = params.get("error");
  const loginHref = role === "business" ? "/login/business" : "/login/personal";

  const [password, setPassword] = useState("");
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, FieldErrorKey>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // トークンが無い／リンクエラーの場合は、再リクエストへ誘導する。
  if (!token || linkError) {
    const forgotHref =
      role === "business"
        ? "/forgot-password/business"
        : "/forgot-password/personal";
    return (
      <div className="flex flex-col gap-6">
        <Notice tone="error">
          <L
            en="This password reset link is invalid or has expired. Please request a new one."
            ja="このパスワード再設定リンクは無効か、有効期限が切れています。お手数ですが、再度お申し込みください。"
          />
        </Notice>
        <Link
          href={forgotHref}
          className="font-semibold text-[#0B1A2E] underline decoration-[#C9A84C]/60 underline-offset-4 transition-colors hover:decoration-[#C9A84C]"
        >
          <L en="Request a new link" ja="再設定リンクを再送する" />
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6">
        <Notice tone="success">
          <L
            en="Your password has been reset. You can now sign in with your new password."
            ja="パスワードを再設定しました。新しいパスワードでログインしてください。"
          />
        </Notice>
        <Link
          href={loginHref}
          className="font-semibold text-[#0B1A2E] underline decoration-[#C9A84C]/60 underline-offset-4 transition-colors hover:decoration-[#C9A84C]"
        >
          <L en="Go to sign in" ja="ログイン画面へ" />
        </Link>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorKey(null);
    const errors = getFieldErrors(resetPasswordSchema, { password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      scrollToFirstError(event.currentTarget);
      return;
    }
    setSubmitting(true);
    const res = await resetPasswordAction({ token, password });
    setSubmitting(false);
    if (!res.ok) {
      setErrorKey(res.error);
      return;
    }
    setDone(true);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
      {errorKey && (
        <Notice tone="error">
          {errorKey === "weak" ? (
            <L
              en="Please use a password of at least 8 characters."
              ja="パスワードは8文字以上でご設定ください。"
            />
          ) : errorKey === "unverified" || errorKey === "invalid" ? (
            <L
              en="This reset link is invalid or has expired. Please request a new one."
              ja="この再設定リンクは無効か、有効期限が切れています。再度お申し込みください。"
            />
          ) : (
            <L
              en="Could not reset your password. Please try again in a moment."
              ja="パスワードを再設定できませんでした。時間をおいて再度お試しください。"
            />
          )}
        </Notice>
      )}

      <Field
        id="reset-password"
        label="NEW PASSWORD"
        jp="新しいパスワード"
        required
      >
        <input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.password)}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setFieldErrors({});
          }}
          className={inputCls}
          placeholder="••••••••"
        />
        <FieldError error={fieldErrors.password} />
        <p className="mt-2 text-[11.5px] leading-[1.6] text-[#0B1A2E]/55">
          <L
            en="At least 8 characters."
            ja="8文字以上で設定してください。"
          />
        </p>
      </Field>

      <PrimaryButton disabled={submitting}>
        {submitting ? (
          <L en="UPDATING…" ja="更新中…" />
        ) : (
          <L en="SET NEW PASSWORD" ja="パスワードを更新する" />
        )}
      </PrimaryButton>
    </form>
  );
}
