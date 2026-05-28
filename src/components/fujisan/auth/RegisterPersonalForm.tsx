"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { L } from "@/i18n/Localized";
import { Field, inputCls, PrimaryButton, Notice, OrDivider } from "./ui";
import { GoogleButton } from "./GoogleButton";

type ErrorKey = "exists" | "weak" | "generic" | null;

function classify(error: { code?: string; status?: number } | null): ErrorKey {
  if (!error) return null;
  const code = (error.code ?? "").toUpperCase();
  if (code.includes("EXIST") || error.status === 422) return "exists";
  if (code.includes("PASSWORD")) return "weak";
  return "generic";
}

export function RegisterPersonalForm({
  googleEnabled = false,
}: {
  googleEnabled?: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorKey, setErrorKey] = useState<ErrorKey>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorKey(null);
    setSubmitting(true);
    const { error } = await signUp.email({
      name,
      email,
      password,
      role: "personal",
    });
    setSubmitting(false);
    if (error) {
      setErrorKey(classify(error));
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-6">
        <Notice tone="success">
          <L
            en={`We've sent a confirmation link to ${email}. Open it to verify your address, then sign in.`}
            ja={`${email} に確認メールを送信しました。リンクを開いてメールアドレスを認証のうえ、ログインしてください。`}
          />
        </Notice>
        <Link
          href="/login/personal"
          className="font-semibold text-[#0B1A2E] underline decoration-[#C9A84C]/60 underline-offset-4 transition-colors hover:decoration-[#C9A84C]"
        >
          <L en="Go to sign in" ja="ログイン画面へ" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-7">
      {errorKey && (
        <Notice tone="error">
          {errorKey === "exists" ? (
            <L
              en="An account with this email already exists. Try signing in instead."
              ja="このメールアドレスは既に登録されています。ログインをお試しください。"
            />
          ) : errorKey === "weak" ? (
            <L
              en="Password must be at least 8 characters."
              ja="パスワードは8文字以上で設定してください。"
            />
          ) : (
            <L
              en="Could not create your account. Please try again."
              ja="アカウントを作成できませんでした。再度お試しください。"
            />
          )}
        </Notice>
      )}

      <Field id="reg-name" label="NAME" jp="お名前">
        <input
          id="reg-name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          placeholder="佐藤 優子"
        />
      </Field>

      <Field id="reg-email" label="EMAIL" jp="メールアドレス">
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder="you@example.com"
        />
      </Field>

      <Field id="reg-password" label="PASSWORD" jp="パスワード（8文字以上）">
        <input
          id="reg-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          placeholder="••••••••"
        />
      </Field>

      <PrimaryButton disabled={submitting}>
        {submitting ? (
          <L en="CREATING…" ja="登録中…" />
        ) : (
          <L en="CREATE ACCOUNT" ja="アカウントを作成" />
        )}
      </PrimaryButton>

      {googleEnabled && (
        <>
          <OrDivider>
            <L en="OR" ja="または" />
          </OrDivider>
          <GoogleButton redirectTo="/account">
            <L en="Continue with Google" ja="Google で続ける" />
          </GoogleButton>
        </>
      )}

      <p className="mt-2 text-[12.5px] leading-[1.7] text-[#1D2432]/72">
        <L en="Already have an account?" ja="すでにアカウントをお持ちですか？" />{" "}
        <Link
          href="/login/personal"
          className="font-semibold text-[#0B1A2E] underline decoration-[#C9A84C]/60 underline-offset-4 transition-colors hover:decoration-[#C9A84C]"
        >
          <L en="Sign in" ja="ログイン" />
        </Link>
      </p>
    </form>
  );
}
