"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/actions/auth";
import {
  getFieldErrors,
  forgotPasswordSchema,
  type FieldErrorKey,
} from "@/lib/validation/forms";
import { FieldError } from "@/components/fujisan/FieldError";
import { scrollToFirstError } from "@/lib/scrollToFirstError";
import { L } from "@/i18n/Localized";
import { Field, inputCls, PrimaryButton, Notice } from "./ui";

export function ForgotPasswordForm({
  role,
}: {
  role: "personal" | "business";
}) {
  const loginHref = role === "business" ? "/login/business" : "/login/personal";

  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, FieldErrorKey>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = getFieldErrors(forgotPasswordSchema, { email });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      scrollToFirstError(event.currentTarget);
      return;
    }
    setSubmitting(true);
    await requestPasswordResetAction({ email });
    setSubmitting(false);
    // 列挙を避けるため、結果に関わらず一律「送信しました」を表示する
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-6">
        <Notice tone="success">
          <L
            en={`If an account exists for ${email}, we've sent a link to reset your password. Please check your inbox (and spam folder).`}
            ja={`${email} のアカウントが存在する場合、パスワード再設定用のリンクをお送りしました。受信トレイ（迷惑メールフォルダもあわせて）をご確認ください。`}
          />
        </Notice>
        <Link
          href={loginHref}
          className="font-semibold text-[#0B1A2E] underline decoration-[#C9A84C]/60 underline-offset-4 transition-colors hover:decoration-[#C9A84C]"
        >
          <L en="Back to sign in" ja="ログイン画面へ戻る" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
      <Field id="forgot-email" label="EMAIL" jp="メールアドレス" required>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setFieldErrors({});
          }}
          className={inputCls}
          placeholder="you@example.com"
        />
        <FieldError error={fieldErrors.email} />
      </Field>

      <PrimaryButton disabled={submitting}>
        {submitting ? (
          <L en="SENDING…" ja="送信中…" />
        ) : (
          <L en="SEND RESET LINK" ja="再設定リンクを送る" />
        )}
      </PrimaryButton>

      <p className="mt-2 text-[12.5px] leading-[1.7] text-[#1D2432]/72">
        <L en="Remembered your password?" ja="パスワードを思い出しましたか？" />{" "}
        <Link
          href={loginHref}
          className="font-semibold text-[#0B1A2E] underline decoration-[#C9A84C]/60 underline-offset-4 transition-colors hover:decoration-[#C9A84C]"
        >
          <L en="Sign in" ja="ログイン" />
        </Link>
      </p>
    </form>
  );
}
