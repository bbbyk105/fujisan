"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInAction } from "@/lib/actions/auth";
import type { AuthErrorKey } from "@/lib/auth-errors";
import {
  getFieldErrors,
  loginSchema,
  type FieldErrorKey,
} from "@/lib/validation/forms";
import { FieldError } from "@/components/fujisan/FieldError";
import { scrollToFirstError } from "@/lib/scrollToFirstError";
import { L } from "@/i18n/Localized";
import { Field, inputCls, PrimaryButton, Notice, OrDivider } from "./ui";
import { GoogleButton } from "./GoogleButton";

export function LoginForm({
  role,
  googleEnabled = false,
}: {
  role: "personal" | "business";
  googleEnabled?: boolean;
}) {
  const params = useSearchParams();
  const fallback = role === "business" ? "/shop/business" : "/account";
  const redirectTo = params.get("redirect") || fallback;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, FieldErrorKey>
  >({});
  const [submitting, setSubmitting] = useState(false);

  const registerHref =
    role === "business" ? "/register/business" : "/register/personal";

  const clearError = (field: string) =>
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorKey(null);
    const errors = getFieldErrors(loginSchema, { email, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      scrollToFirstError(event.currentTarget);
      return;
    }
    setSubmitting(true);
    const res = await signInAction({ email, password });
    if (!res.ok) {
      setSubmitting(false);
      setErrorKey(res.error);
      return;
    }
    // フルリロードして、ヘッダーナビのセッション表示も確実に同期する
    window.location.href = redirectTo;
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
      {errorKey && (
        <Notice tone="error">
          {errorKey === "unverified" ? (
            <L
              en="Please verify your email — check the link we sent to your inbox."
              ja="メールアドレスの確認が必要です。お送りした確認メールのリンクをクリックしてください。"
            />
          ) : errorKey === "invalid" ? (
            <L
              en="Invalid email or password."
              ja="メールアドレスまたはパスワードが正しくありません。"
            />
          ) : (
            <L
              en="Sign-in failed. Please try again in a moment."
              ja="ログインに失敗しました。時間をおいて再度お試しください。"
            />
          )}
        </Notice>
      )}

      <Field id="login-email" label="EMAIL" jp="メールアドレス" required>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError("email");
          }}
          className={inputCls}
          placeholder="you@example.com"
        />
        <FieldError error={fieldErrors.email} />
      </Field>

      <Field id="login-password" label="PASSWORD" jp="パスワード" required>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(fieldErrors.password)}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError("password");
          }}
          className={inputCls}
          placeholder="••••••••"
        />
        <FieldError error={fieldErrors.password} />
      </Field>

      <PrimaryButton disabled={submitting}>
        {submitting ? (
          <L en="SIGNING IN…" ja="ログイン中…" />
        ) : (
          <L en="SIGN IN" ja="ログイン" />
        )}
      </PrimaryButton>

      {role === "personal" && googleEnabled && (
        <>
          <OrDivider>
            <L en="OR" ja="または" />
          </OrDivider>
          <GoogleButton redirectTo={redirectTo}>
            <L en="Continue with Google" ja="Google で続ける" />
          </GoogleButton>
        </>
      )}

      <p className="mt-2 text-[12.5px] leading-[1.7] text-[#1D2432]/72">
        <L en="No account yet?" ja="アカウントをお持ちでないですか？" />{" "}
        <Link
          href={registerHref}
          className="font-semibold text-[#0B1A2E] underline decoration-[#C9A84C]/60 underline-offset-4 transition-colors hover:decoration-[#C9A84C]"
        >
          <L en="Create one" ja="新規登録" />
        </Link>
      </p>
    </form>
  );
}
