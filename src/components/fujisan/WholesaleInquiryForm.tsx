"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { fujisanProducts } from "@/data/fujisan-products";
import {
  getFieldErrors,
  wholesaleSchema,
  type FieldErrorKey,
} from "@/lib/validation/forms";
import { FieldError } from "@/components/fujisan/FieldError";
import { scrollToFirstError } from "@/lib/scrollToFirstError";
import { L } from "@/i18n/Localized";
import { useLocale } from "@/i18n/useLocale";

type Status = "idle" | "submitting" | "sent";

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurant · 飲食店" },
  { value: "bar", label: "Bar / Izakaya · バー・居酒屋" },
  { value: "hotel", label: "Hotel / Hospitality · ホテル・宿泊" },
  { value: "retail", label: "Retailer · 小売" },
  { value: "ec", label: "Online Reseller · オンライン販売" },
  { value: "export", label: "Export / Distribution · 輸出・流通" },
  { value: "other", label: "Other · その他" },
];

const VOLUMES = [
  { value: "case-1-3", label: "1 – 3 cases / month (6 – 36 本)" },
  { value: "case-4-10", label: "4 – 10 cases / month (24 – 120 本)" },
  { value: "case-11-30", label: "11 – 30 cases / month (66 – 360 本)" },
  { value: "case-30plus", label: "30+ cases / month · スポット大口" },
  { value: "undecided", label: "Undecided · 未定 / ご相談" },
];

const TIMING = [
  { value: "asap", label: "Within 2 weeks · 2週間以内" },
  { value: "this-quarter", label: "Within 1 – 2 months · 1〜2ヶ月以内" },
  { value: "next-quarter", label: "3+ months out · 3ヶ月以降" },
  { value: "flexible", label: "Flexible · 時期未定" },
];

export function WholesaleInquiryForm() {
  const [status, setStatus] = useState<Status>("idle");

  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0].value);
  const [country, setCountry] = useState("Japan");
  const [website, setWebsite] = useState("");
  const [volume, setVolume] = useState(VOLUMES[0].value);
  const [timing, setTiming] = useState(TIMING[0].value);
  const [interested, setInterested] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [licenseConfirmed, setLicenseConfirmed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, FieldErrorKey>
  >({});
  const locale = useLocale();

  const toggleSlug = (slug: string) =>
    setInterested((s) =>
      s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug],
    );

  const clearError = (field: string) =>
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = getFieldErrors(wholesaleSchema, {
      company,
      contactName,
      email,
      phone,
      country,
      website,
      message,
      licenseConfirmed,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      scrollToFirstError(event.currentTarget);
      return;
    }
    setStatus("submitting");
    window.setTimeout(() => setStatus("sent"), 700);
  };

  if (status === "sent") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="border border-[#0F1F36]/14 bg-[#F1E6CB]/55 px-7 py-12 md:px-10 md:py-16"
      >
        <span className="font-jp text-[12px] tracking-[0.3em] text-[#C9A84C]">
          ― お問い合わせを受領いたしました ―
        </span>
        <h3 className="mt-5 font-serif text-[clamp(22px,2.4vw,30px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#0B1A2E]">
          <L
            en={`Thank you, ${contactName || company || "partner of Fujisan"}.`}
            ja={`${contactName || company || "ご担当者"}さま、ありがとうございます。`}
          />
        </h3>
        <p className="mt-5 max-w-[520px] text-[14px] font-light leading-[1.85] text-[#1D2432]/82">
          <L
            en="Your wholesale enquiry has reached our trade desk in Shizuoka. Our export team will respond — in Japanese or English — within two business days, with pricing, lead times, and a sample plan tailored to your programme."
            ja="卸のお問い合わせは、静岡のトレードデスクに届きました。担当チームより、2営業日以内に日本語または英語で、価格・納期・貴店に合わせたサンプルのご提案をお送りします。"
          />
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setCompany("");
            setContactName("");
            setEmail("");
            setPhone("");
            setBusinessType(BUSINESS_TYPES[0].value);
            setCountry("Japan");
            setWebsite("");
            setVolume(VOLUMES[0].value);
            setTiming(TIMING[0].value);
            setInterested([]);
            setMessage("");
            setLicenseConfirmed(false);
          }}
          className="group/link mt-10 inline-flex items-center gap-3 cursor-pointer border-0 bg-transparent p-0 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E]"
        >
          <span className="relative pb-1">
            <L en="SUBMIT ANOTHER ENQUIRY" ja="別の内容で問い合わせる" />
            <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/50 transition-all duration-500 group-hover/link:bg-[#C9A84C]" />
          </span>
          <span
            aria-hidden
            className="transition-transform duration-500 group-hover/link:translate-x-1 group-hover/link:text-[#C9A84C]"
          >
            →
          </span>
        </button>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        <Field id="wh-company" label="COMPANY" jp="貴社・店舗名" required>
          <input
            id="wh-company"
            type="text"
            autoComplete="organization"
            aria-invalid={Boolean(fieldErrors.company)}
            value={company}
            onChange={(e) => {
              setCompany(e.target.value);
              clearError("company");
            }}
            className={inputCls}
            placeholder={
              locale === "ja" ? "株式会社〇〇商店" : "Sample Trading Co., Ltd."
            }
          />
          <FieldError error={fieldErrors.company} />
        </Field>
        <Field id="wh-contact" label="CONTACT NAME" jp="ご担当者名" required>
          <input
            id="wh-contact"
            type="text"
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.contactName)}
            value={contactName}
            onChange={(e) => {
              setContactName(e.target.value);
              clearError("contactName");
            }}
            className={inputCls}
            placeholder={locale === "ja" ? "佐々木 優子" : "Sasaki Yuko"}
          />
          <FieldError error={fieldErrors.contactName} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        <Field id="wh-email" label="EMAIL" jp="メールアドレス" required>
          <input
            id="wh-email"
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
        <Field id="wh-phone" label="PHONE" jp="ご連絡先電話番号">
          <input
            id="wh-phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputCls}
            placeholder="03-xxxx-xxxx"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        <Field id="wh-type" label="BUSINESS TYPE" jp="業態">
          <SelectShell>
            <select
              id="wh-type"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className={selectCls}
            >
              {BUSINESS_TYPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </SelectShell>
        </Field>
        <Field id="wh-country" label="COUNTRY · REGION" jp="国・地域" required>
          <input
            id="wh-country"
            type="text"
            autoComplete="country-name"
            aria-invalid={Boolean(fieldErrors.country)}
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              clearError("country");
            }}
            className={inputCls}
            placeholder={
              locale === "ja"
                ? "日本 / シンガポール / イギリス"
                : "Japan / Singapore / United Kingdom"
            }
          />
          <FieldError error={fieldErrors.country} />
        </Field>
      </div>

      <Field
        id="wh-website"
        label="WEBSITE / INSTAGRAM"
        jp="サイト・SNS（任意）"
      >
        <input
          id="wh-website"
          type="url"
          aria-invalid={Boolean(fieldErrors.website)}
          value={website}
          onChange={(e) => {
            setWebsite(e.target.value);
            clearError("website");
          }}
          className={inputCls}
          placeholder="https://example.com"
        />
        <FieldError error={fieldErrors.website} />
      </Field>

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        <Field id="wh-volume" label="EXPECTED VOLUME" jp="想定取扱量">
          <SelectShell>
            <select
              id="wh-volume"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className={selectCls}
            >
              {VOLUMES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </SelectShell>
        </Field>
        <Field id="wh-timing" label="START DATE" jp="開始希望時期">
          <SelectShell>
            <select
              id="wh-timing"
              value={timing}
              onChange={(e) => setTiming(e.target.value)}
              className={selectCls}
            >
              {TIMING.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </SelectShell>
        </Field>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-[12px] font-semibold tracking-[0.16em] text-[#0B1A2E]/75">
          <L
            en="INTERESTED LABELS (optional)"
            ja="気になる銘柄（任意・複数選択可）"
          />
        </legend>
        <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {fujisanProducts.map((p) => {
            const checked = interested.includes(p.slug);
            return (
              <label
                key={p.slug}
                className={`group flex cursor-pointer items-start gap-3 border px-4 py-3 text-[12px] leading-[1.5] transition-colors ${
                  checked
                    ? "border-[#0B1A2E] bg-[#F1E6CB]/70 text-[#0B1A2E]"
                    : "border-[#0F1F36]/14 bg-transparent text-[#0F1F36]/78 hover:border-[#0F1F36]/35"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSlug(p.slug)}
                  className="mt-[3px] h-3.5 w-3.5 cursor-pointer accent-[#0B1A2E]"
                />
                <span className="flex flex-col">
                  <span className="font-serif text-[12px] font-semibold tracking-[0.16em]">
                    {p.name} · {p.variant.replace(/\n/g, " ")}
                  </span>
                  <span className="mt-0.5 font-jp text-[10.5px] tracking-[0.18em] text-[#C9A84C]/85">
                    {p.variantLineJp}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Field id="wh-message" label="NOTES" jp="ご相談内容・補足">
        <textarea
          id="wh-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full resize-none border-b border-[#0F1F36]/30 bg-transparent py-3 text-[15px] leading-[1.7] text-[#0F1F36] outline-none transition-colors placeholder:text-[#0F1F36]/40 focus:border-[#C9A84C]"
          placeholder={
            locale === "ja"
              ? "ご構想・ご希望の価格帯・開始時期など、お気軽にお書きください…"
              : "Programme concept, price range, target launch date, anything else we should know…"
          }
        />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 text-[12.5px] leading-[1.65] text-[#0F1F36]/80 select-none">
        <input
          type="checkbox"
          checked={licenseConfirmed}
          aria-invalid={Boolean(fieldErrors.licenseConfirmed)}
          onChange={(e) => {
            setLicenseConfirmed(e.target.checked);
            clearError("licenseConfirmed");
          }}
          className="mt-[3px] h-4 w-4 cursor-pointer accent-[#0B1A2E]"
        />
        <span>
          <L
            en="I confirm that my business holds (or is in the process of obtaining) the necessary licences to handle alcoholic beverages in its country and region."
            ja="当社（店舗）が、酒類を取り扱うために必要な免許・許可を保有している、または取得の手続き中であることを確認しました。"
          />
        </span>
      </label>
      <FieldError error={fieldErrors.licenseConfirmed} />

      <p className="text-[11px] leading-[1.65] text-[#0F1F36]/55">
        <L
          en={
            <>
              By submitting, you acknowledge our{" "}
              <a
                href="/privacy"
                className="underline underline-offset-2 transition-colors hover:text-[#C9A84C]"
              >
                privacy policy
              </a>
              . Trade pricing is shared only with verified business partners.
            </>
          }
          ja={
            <>
              送信をもって、当社の
              <a
                href="/privacy"
                className="underline underline-offset-2 transition-colors hover:text-[#C9A84C]"
              >
                プライバシーポリシー
              </a>
              に同意したものとみなします。卸価格は、確認のとれた取引先のみにお伝えしています。
            </>
          }
        />
      </p>

      <div className="mt-2 flex items-center justify-between gap-6">
        <button
          type="submit"
          disabled={submitting}
          className="group/btn inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-[10.5px] font-semibold tracking-[0.34em] text-[#0F1F36] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="relative pb-1">
            {submitting ? (
              <L en="SENDING…" ja="送信中…" />
            ) : (
              <L en="REQUEST A QUOTE" ja="お見積りを依頼" />
            )}
            <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0F1F36]/50 transition-all duration-500 group-hover/btn:bg-[#C9A84C]" />
          </span>
          <span
            aria-hidden
            className="transition-transform duration-500 group-hover/btn:translate-x-1 group-hover/btn:text-[#C9A84C]"
          >
            →
          </span>
        </button>

        <span className="hidden font-jp text-[10px] tracking-[0.3em] text-[#C9A84C]/85 sm:inline">
          ― 卸のお見積もり ―
        </span>
      </div>
    </form>
  );
}

const inputCls =
  "w-full border-b border-[#0F1F36]/30 bg-transparent py-3 text-[15px] text-[#0F1F36] outline-none transition-colors placeholder:text-[#0F1F36]/40 focus:border-[#C9A84C] aria-[invalid=true]:border-[#8B1A1A] aria-[invalid=true]:focus:border-[#8B1A1A]";

const selectCls =
  "w-full appearance-none border-b border-[#0F1F36]/30 bg-transparent py-3 pr-8 text-[15px] text-[#0F1F36] outline-none transition-colors focus:border-[#C9A84C]";

function Field({
  id,
  label,
  jp,
  required,
  children,
}: {
  id: string;
  label: string;
  jp: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[12px] font-semibold tracking-[0.16em] text-[#0B1A2E]/75"
      >
        <L ja={jp} en={label} />
        {required && (
          <span aria-hidden className="ml-1 text-[#8B1A1A]">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

function SelectShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <svg
        aria-hidden
        viewBox="0 0 12 8"
        width="12"
        height="8"
        fill="none"
        className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-[#0F1F36]/55"
      >
        <path
          d="M1 1L6 7L11 1"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
