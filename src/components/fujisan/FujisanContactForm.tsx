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

const MESSAGE_MAX = 1000;

export function FujisanContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<string>(SUBJECTS[0].value);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, FieldErrorKey>>(
    {},
  );
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
        className="border border-[#0F1F36]/14 bg-[#F1E6CB]/55 px-7 py-14 text-center md:px-10 md:py-18"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#C9A84C]/70">
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            width="18"
            height="18"
            fill="none"
            className="text-[#C9A84C]"
          >
            <path
              d="M3 8.5L6.5 12L13 4.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="mt-6 font-jp text-[12px] tracking-[0.3em] text-[#C9A84C]">
          ― 受領いたしました ―
        </p>
        <h3 className="mt-5 font-serif text-[clamp(22px,2.4vw,30px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#0B1A2E]">
          <L
            en={`Thank you, ${name || "friend of Fujisan"}.`}
            ja={`${name || "富士山の友"}さま、ありがとうございます。`}
          />
        </h3>
        <p className="mx-auto mt-5 max-w-[460px] text-[14px] font-light leading-[1.85] text-[#1D2432]/82">
          <L
            en="Your message has reached our small team in Shizuoka. We read every enquiry by hand and will reply, in Japanese or English, usually within one business day."
            ja="メッセージは静岡のチームに届きました。いただいたお問い合わせはひとつずつ拝読し、通常1営業日以内に日本語または英語でご返信します。"
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        <Field id="contact-name" label="NAME" jp="お名前" required>
          <div className="relative">
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
              className="peer w-full border-b border-[#0F1F36]/22 bg-transparent py-3 text-[15px] text-[#0F1F36] outline-none transition-colors placeholder:text-[#0F1F36]/35 aria-[invalid=true]:border-[#8B1A1A]"
              placeholder={locale === "ja" ? "佐々木 優子" : "Sasaki Yuko"}
            />
            <FocusLine />
          </div>
          <FieldError error={fieldErrors.name} />
        </Field>

        <Field id="contact-email" label="EMAIL" jp="メールアドレス" required>
          <div className="relative">
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
              className="peer w-full border-b border-[#0F1F36]/22 bg-transparent py-3 text-[15px] text-[#0F1F36] outline-none transition-colors placeholder:text-[#0F1F36]/35 aria-[invalid=true]:border-[#8B1A1A]"
              placeholder="you@example.com"
            />
            <FocusLine />
          </div>
          <FieldError error={fieldErrors.email} />
        </Field>
      </div>

      <Field id="contact-subject" label="SUBJECT" jp="ご用件" required>
        <div className="relative">
          <select
            id="contact-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="peer w-full appearance-none border-b border-[#0F1F36]/22 bg-transparent py-3 pr-8 text-[15px] text-[#0F1F36] outline-none transition-colors"
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
          <FocusLine />
        </div>
      </Field>

      <Field id="contact-message" label="MESSAGE" jp="ご用件詳細" required>
        <div className="relative">
          <textarea
            id="contact-message"
            aria-invalid={Boolean(fieldErrors.message)}
            value={message}
            maxLength={MESSAGE_MAX}
            onChange={(e) => {
              setMessage(e.target.value);
              clearError("message");
            }}
            rows={5}
            className="peer w-full resize-none border-b border-[#0F1F36]/22 bg-transparent py-3 text-[15px] leading-[1.7] text-[#0F1F36] outline-none transition-colors placeholder:text-[#0F1F36]/35 aria-[invalid=true]:border-[#8B1A1A]"
            placeholder={
              locale === "ja"
                ? "ご用件を簡単にお書きください…"
                : "Tell us a little about your enquiry…"
            }
          />
          <FocusLine />
        </div>
        <div className="flex items-start justify-between gap-4">
          <FieldError error={fieldErrors.message} />
          <span
            aria-hidden
            className={`ml-auto shrink-0 text-[10.5px] tracking-[0.14em] tabular-nums transition-colors ${
              message.length > MESSAGE_MAX * 0.9
                ? "text-[#C9A84C]"
                : "text-[#0F1F36]/40"
            }`}
          >
            {message.length} / {MESSAGE_MAX}
          </span>
        </div>
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

      <div className="mt-1 flex items-center justify-between gap-6">
        <button
          type="submit"
          disabled={submitting}
          className="group/btn inline-flex cursor-pointer items-center justify-center gap-3 border border-[#0B1A2E] bg-[#0B1A2E] px-9 py-4 text-[11px] font-semibold tracking-[0.28em] text-paper-card transition-all duration-300 hover:bg-[#1D2432] disabled:cursor-wait disabled:opacity-60"
        >
          <span
            key={submitting ? "sending" : "idle"}
            className="fujisan-swap gap-3"
          >
            {submitting ? (
              <L en="SENDING…" ja="送信中…" />
            ) : (
              <L en="SEND MESSAGE" ja="メッセージを送る" />
            )}
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover/btn:translate-x-1 group-hover/btn:text-[#C9A84C]"
            >
              →
            </span>
          </span>
        </button>

        <span className="hidden font-jp text-[10px] tracking-[0.3em] text-[#C9A84C]/85 sm:inline">
          ― 一礼の便り ―
        </span>
      </div>
    </form>
  );
}

/** フォーカス時に左から伸びる金のヘアライン（input/textarea の下線に重ねる） */
function FocusLine() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[#C9A84C] transition-transform duration-500 peer-focus:scale-x-100"
    />
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
