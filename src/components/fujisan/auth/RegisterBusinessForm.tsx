"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { registerBusinessAction } from "@/lib/actions/auth";
import type { AuthErrorKey } from "@/lib/auth-errors";
import {
  getFieldErrors,
  registerBusinessSchema,
  type FieldErrorKey,
} from "@/lib/validation/forms";
import { FieldError } from "@/components/fujisan/FieldError";
import { scrollToFirstError } from "@/lib/scrollToFirstError";
import { L } from "@/i18n/Localized";
import { Field, inputCls, PrimaryButton, Notice } from "./ui";

export function RegisterBusinessForm() {
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, FieldErrorKey>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

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
    const errors = getFieldErrors(registerBusinessSchema, {
      companyName,
      contactName,
      email,
      phone,
      address,
      password,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      scrollToFirstError(event.currentTarget);
      return;
    }
    setSubmitting(true);
    const res = await registerBusinessAction({
      contactName,
      email,
      password,
      companyName,
      phone,
      address,
    });
    setSubmitting(false);
    if (!res.ok) {
      setErrorKey(res.error);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col gap-6">
        <Notice tone="success">
          <L
            en={`We've sent a confirmation link to ${email}. Verify your address, then sign in to view trade pricing.`}
            ja={`${email} に確認メールを送信しました。メールアドレスを認証のうえログインすると、卸価格をご覧いただけます。`}
          />
        </Notice>
        <Link
          href="/login/business"
          className="font-semibold text-[#0B1A2E] underline decoration-[#C9A84C]/60 underline-offset-4 transition-colors hover:decoration-[#C9A84C]"
        >
          <L en="Go to trade sign in" ja="取扱店ログインへ" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
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

      <Field id="biz-company" label="COMPANY" jp="貴社・店舗名" required>
        <input
          id="biz-company"
          type="text"
          autoComplete="organization"
          aria-invalid={Boolean(fieldErrors.companyName)}
          value={companyName}
          onChange={(e) => {
            setCompanyName(e.target.value);
            clearError("companyName");
          }}
          className={inputCls}
          placeholder="株式会社〇〇商店"
        />
        <FieldError error={fieldErrors.companyName} />
      </Field>

      <Field id="biz-contact" label="CONTACT NAME" jp="ご担当者名" required>
        <input
          id="biz-contact"
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(fieldErrors.contactName)}
          value={contactName}
          onChange={(e) => {
            setContactName(e.target.value);
            clearError("contactName");
          }}
          className={inputCls}
          placeholder="佐々木 優子"
        />
        <FieldError error={fieldErrors.contactName} />
      </Field>

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        <Field id="biz-email" label="EMAIL" jp="メールアドレス" required>
          <input
            id="biz-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            className={inputCls}
            placeholder="trade@example.com"
          />
          <FieldError error={fieldErrors.email} />
        </Field>
        <Field id="biz-phone" label="PHONE" jp="電話番号">
          <input
            id="biz-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
            placeholder="03-xxxx-xxxx"
          />
        </Field>
      </div>

      <Field id="biz-address" label="ADDRESS" jp="所在地（任意）">
        <input
          id="biz-address"
          type="text"
          autoComplete="street-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={inputCls}
          placeholder="東京都〇〇区〇〇 1-2-3"
        />
      </Field>

      <Field id="biz-password" label="PASSWORD" jp="パスワード（8文字以上）" required>
        <input
          id="biz-password"
          type="password"
          autoComplete="new-password"
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

      <p className="text-[11px] leading-[1.65] text-[#0F1F36]/55">
        <L
          en="Trade pricing is shown only to signed-in business accounts. By creating an account you confirm your business handles, or is licensed to handle, alcoholic beverages."
          ja="卸価格はログインした法人アカウントのみに表示されます。登録をもって、貴社が酒類を取り扱う（または取り扱う免許を有する）ことを確認したものとみなします。"
        />
      </p>

      <PrimaryButton disabled={submitting}>
        {submitting ? (
          <L en="CREATING…" ja="登録中…" />
        ) : (
          <L en="CREATE TRADE ACCOUNT" ja="取扱店アカウントを作成" />
        )}
      </PrimaryButton>

      <p className="mt-2 text-[12.5px] leading-[1.7] text-[#1D2432]/72">
        <L en="Already have an account?" ja="すでにアカウントをお持ちですか？" />{" "}
        <Link
          href="/login/business"
          className="font-semibold text-[#0B1A2E] underline decoration-[#C9A84C]/60 underline-offset-4 transition-colors hover:decoration-[#C9A84C]"
        >
          <L en="Sign in" ja="ログイン" />
        </Link>
      </p>
    </form>
  );
}
