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
import { useLocale } from "@/i18n/useLocale";
import {
  TRADE_BUSINESS_TYPES,
  TRADE_BUSINESS_TYPE_LABELS,
  requiresLiquorLicence,
  type TradeBusinessType,
} from "@/data/fujisan-trade";
import {
  Field,
  inputCls,
  PrimaryButton,
  Notice,
  RateLimitMessage,
} from "./ui";
import { ResendVerification } from "./ResendVerification";

export function RegisterBusinessForm() {
  const locale = useLocale();
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [businessType, setBusinessType] = useState<TradeBusinessType | "">("");
  const [licenceNumber, setLicenceNumber] = useState("");
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
      businessType,
      licenceNumber,
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
      businessType,
      licenceNumber,
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
            en={`We've sent a confirmation link to ${email}. Verify your address — then we review your application and reply within two business days. Wholesale pricing appears once the account is approved.`}
            ja={`${email} に確認メールを送信しました。メールアドレスをご認証ください。お申し込みの内容を蔵で確認のうえ、2 営業日以内に審査の結果をご連絡します。卸価格は承認後に表示されます。`}
          />
        </Notice>
        <ResendVerification email={email} role="business" />
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
          {errorKey === "rate" ? (
            <RateLimitMessage />
          ) : errorKey === "exists" ? (
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

      <Field id="biz-type" label="BUSINESS TYPE" jp="業態" required>
        <select
          id="biz-type"
          aria-invalid={Boolean(fieldErrors.businessType)}
          value={businessType}
          onChange={(e) => {
            setBusinessType(e.target.value as TradeBusinessType);
            clearError("businessType");
            clearError("licenceNumber");
          }}
          className={inputCls}
        >
          {/* option の中では <L> が両言語とも見えてしまうので、
              属性値と同じく useLocale() で文言を切り替える。 */}
          <option value="">
            {locale === "ja" ? "― 選択してください ―" : "— Select —"}
          </option>
          {TRADE_BUSINESS_TYPES.map((type) => (
            <option key={type} value={type}>
              {TRADE_BUSINESS_TYPE_LABELS[type][locale]}
            </option>
          ))}
        </select>
        {businessType && (
          <p className="mt-2 text-[11px] leading-[1.7] text-[#0F1F36]/55">
            <L
              en={TRADE_BUSINESS_TYPE_LABELS[businessType].note.en}
              ja={TRADE_BUSINESS_TYPE_LABELS[businessType].note.ja}
            />
          </p>
        )}
        <FieldError error={fieldErrors.businessType} />
      </Field>

      {/* 免許番号は転売する業態でのみ必須。飲食店・宿泊施設の店内提供は
          「販売」ではないので、一律に求めない。 */}
      {businessType && requiresLiquorLicence(businessType) && (
        <Field
          id="biz-licence"
          label="LIQUOR LICENCE"
          jp="酒類販売業免許番号"
          required
        >
          <input
            id="biz-licence"
            type="text"
            aria-invalid={Boolean(fieldErrors.licenceNumber)}
            value={licenceNumber}
            onChange={(e) => {
              setLicenceNumber(e.target.value);
              clearError("licenceNumber");
            }}
            className={inputCls}
            placeholder="〇〇税務署 第〇〇号"
          />
          <p className="mt-2 text-[11px] leading-[1.7] text-[#0F1F36]/55">
            <L
              en="We verify the licence before opening your account."
              ja="口座開設の前に、蔵で内容を確認いたします。"
            />
          </p>
          <FieldError error={fieldErrors.licenceNumber} />
        </Field>
      )}

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
          en="Registering opens an application, not an account. We check the details by hand — wholesale pricing is shown only after approval. By applying you confirm your business handles, or is licensed to handle, alcoholic beverages."
          ja="ご登録は「お申し込み」です。内容を蔵で確認のうえ承認した後に、卸価格が表示されます。お申し込みをもって、貴社が酒類を取り扱う（または取り扱う免許を有する）ことを確認したものとみなします。"
        />
      </p>

      <PrimaryButton disabled={submitting}>
        {submitting ? (
          <L en="SUBMITTING…" ja="送信中…" />
        ) : (
          <L en="APPLY FOR A TRADE ACCOUNT" ja="取扱口座を申し込む" />
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
