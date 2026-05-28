"use client";

import { useState, type FormEvent } from "react";
import { L } from "@/i18n/Localized";
import { useLocale } from "@/i18n/useLocale";
import {
  getFieldErrors,
  contactSchema,
  type FieldErrorKey,
} from "@/lib/validation/forms";
import { FieldError } from "@/components/fujisan/FieldError";
import { scrollToFirstError } from "@/lib/scrollToFirstError";

type Status = "idle" | "submitting" | "sent";

const SUBJECTS = [
  { value: "general", label: "General enquiry · 一般のお問い合わせ" },
  { value: "trade", label: "Trade & Wholesale · 卸・取扱店" },
  { value: "visit", label: "Brewery Visit · 蔵見学" },
  { value: "press", label: "Press & Media · 取材" },
];

export function FujisanContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(SUBJECTS[0].value);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, FieldErrorKey>
  >({});
  const locale = useLocale();

  const clearError = (field: string) =>
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = getFieldErrors(contactSchema, {
      name,
      email,
      subject,
      message,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      scrollToFirstError(event.currentTarget);
      return;
    }
    setStatus("submitting");
    // No backend yet — settle on a brand-coherent acknowledgement state.
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
          ― 受領いたしました ―
        </span>
        <h3 className="mt-5 font-serif text-[clamp(22px,2.4vw,30px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#0B1A2E]">
          <L
            en={`Thank you, ${name || "friend of Fujisan"}.`}
            ja={`${name || "富士山の友"}さま、ありがとうございます。`}
          />
        </h3>
        <p className="mt-5 max-w-[460px] text-[14px] font-light leading-[1.85] text-[#1D2432]/82">
          <L
            en="Your message has reached our small team in Shizuoka. We read every enquiry by hand and will reply, in Japanese or English, usually within one business day."
            ja="メッセージは静岡の小さなチームに届きました。いただいたお問い合わせはひとつずつ拝読し、通常1営業日以内に日本語または英語でご返信します。"
          />
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setName("");
            setEmail("");
            setMessage("");
            setSubject(SUBJECTS[0].value);
          }}
          className="group/link mt-10 inline-flex items-center gap-3 cursor-pointer border-0 bg-transparent p-0 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E]"
        >
          <span className="relative pb-1">
            <L en="SEND ANOTHER MESSAGE" ja="もう一度送る" />
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-7" noValidate>
      <Field id="contact-name" label="NAME" jp="お名前" required>
        <input
          id="contact-name"
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(fieldErrors.name)}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError("name");
          }}
          className="w-full border-b border-[#0F1F36]/22 bg-transparent py-3 text-[15px] text-[#0F1F36] outline-none transition-colors placeholder:text-[#0F1F36]/35 focus:border-[#C9A84C] aria-[invalid=true]:border-[#8B1A1A] aria-[invalid=true]:focus:border-[#8B1A1A]"
          placeholder={locale === "ja" ? "佐々木 優子" : "Sasaki Yuko"}
        />
        <FieldError error={fieldErrors.name} />
      </Field>

      <Field id="contact-email" label="EMAIL" jp="メールアドレス" required>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError("email");
          }}
          className="w-full border-b border-[#0F1F36]/22 bg-transparent py-3 text-[15px] text-[#0F1F36] outline-none transition-colors placeholder:text-[#0F1F36]/35 focus:border-[#C9A84C] aria-[invalid=true]:border-[#8B1A1A] aria-[invalid=true]:focus:border-[#8B1A1A]"
          placeholder="you@example.com"
        />
        <FieldError error={fieldErrors.email} />
      </Field>

      <Field id="contact-subject" label="SUBJECT" jp="ご用件" required>
        <div className="relative">
          <select
            id="contact-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full appearance-none border-b border-[#0F1F36]/22 bg-transparent py-3 pr-8 text-[15px] text-[#0F1F36] outline-none transition-colors focus:border-[#C9A84C]"
          >
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
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
      </Field>

      <Field id="contact-message" label="MESSAGE" jp="ご用件詳細" required>
        <textarea
          id="contact-message"
          aria-invalid={Boolean(fieldErrors.message)}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            clearError("message");
          }}
          rows={5}
          className="w-full resize-none border-b border-[#0F1F36]/22 bg-transparent py-3 text-[15px] leading-[1.7] text-[#0F1F36] outline-none transition-colors placeholder:text-[#0F1F36]/35 focus:border-[#C9A84C] aria-[invalid=true]:border-[#8B1A1A] aria-[invalid=true]:focus:border-[#8B1A1A]"
          placeholder={
            locale === "ja"
              ? "ご用件を簡単にお書きください…"
              : "Tell us a little about your enquiry…"
          }
        />
        <FieldError error={fieldErrors.message} />
      </Field>

      <p className="text-[11px] leading-[1.65] text-[#0F1F36]/55">
        <L
          en={
            <>
              By sending, you acknowledge our{" "}
              <a
                href="/privacy"
                className="underline underline-offset-2 transition-colors hover:text-[#C9A84C]"
              >
                privacy policy
              </a>
              . We never share your details.
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
              に同意したものとみなします。お客様の情報を第三者と共有することはありません。
            </>
          }
        />
      </p>

      <div className="mt-2 flex items-center justify-between gap-6">
        <button
          type="submit"
          disabled={submitting}
          className="group/btn inline-flex cursor-pointer items-center gap-3 border-0 bg-transparent p-0 text-[10.5px] font-semibold tracking-[0.34em] text-[#0F1F36] disabled:cursor-wait disabled:opacity-60"
        >
          <span className="relative pb-1">
            {submitting ? (
              <L en="SENDING…" ja="送信中…" />
            ) : (
              <L en="SEND MESSAGE" ja="メッセージを送る" />
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
          ― 一礼の便り ―
        </span>
      </div>
    </form>
  );
}

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
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
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
