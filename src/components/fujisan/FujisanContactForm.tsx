"use client";

import { useState, type FormEvent } from "react";
import { L } from "@/i18n/Localized";
import { useLocale } from "@/i18n/useLocale";
import {
  getFieldErrors,
  contactSchema,
  CONTACT_MESSAGE_MAX,
  type FieldErrorKey,
} from "@/lib/validation/forms";
import { FieldError } from "@/components/fujisan/FieldError";
import { scrollToFirstError } from "@/lib/scrollToFirstError";
import { submitContactAction } from "@/lib/actions/contact";
import { FUJISAN_LEGAL } from "@/data/fujisan-legal";
import {
  CONTACT_SUBJECTS,
  CONTACT_SUBJECT_LABELS,
} from "@/data/fujisan-contact";

type Status = "idle" | "submitting" | "sent";

/** 送信の失敗理由。サーバーアクションの error をそのまま受ける。 */
type SubmitError = "invalid" | "rate" | "db";

/** 用件は src/data/fujisan-contact.ts を唯一の出どころにする（サーバー側の検証と一致させる）。 */
const SUBJECTS = CONTACT_SUBJECTS.map((value) => ({
  value,
  ...CONTACT_SUBJECT_LABELS[value],
}));

const MESSAGE_MAX = CONTACT_MESSAGE_MAX;

export function FujisanContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<string>(SUBJECTS[0].value);
  const [message, setMessage] = useState("");
  // ハニーポット。CSS で隠してあり、人間が触ることはない。
  const [website, setWebsite] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, FieldErrorKey>>(
    {},
  );
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);
  const locale = useLocale();

  const clearError = (field: string) =>
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
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
    const res = await submitContactAction({
      name,
      email,
      subject,
      message,
      locale,
      website,
    });
    if (res.ok) {
      setStatus("sent");
      return;
    }
    // 失敗したら入力はそのまま残して、もう一度送れるようにする。
    setStatus("idle");
    setSubmitError(res.error);
  };

  if (status === "sent") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="border-t border-[var(--ed-rule-strong)] pt-9"
      >
        <p className="ed-label">
          <L en="Received" ja="受け付けました" />
        </p>
        <h3 className="ed-h2 mt-3">
          <L
            en={`Thank you, ${name || "friend of Fujisan"}.`}
            ja={`${name || "富士山の友"}さま、ありがとうございます。`}
          />
        </h3>
        <p className="ed-p mt-5">
          <L
            en="Your message has reached our small team in Shizuoka. We read every enquiry by hand and will reply, in Japanese or English, usually within two business days."
            ja="メッセージは静岡のチームに届きました。いただいたお問い合わせはひとつずつ拝読し、通常2営業日以内に日本語または英語でご返信します。"
          />
        </p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setName("");
            setEmail("");
            setMessage("");
            setWebsite("");
            setSubmitError(null);
            setSubject(SUBJECTS[0].value);
          }}
          className="ed-link mt-9 cursor-pointer border-0 bg-transparent p-0 text-[13px]"
        >
          <L en="Send another message" ja="もう一度送る" />
        </button>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      {/*
        ハニーポット。スクリーンリーダーとタブ順からも外し、人間には到達させない。
        値が入って送られてきたら bot と判断してサーバー側で静かに捨てる。
      */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
        <Field id="contact-name" label="Name" jp="お名前" required>
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
              className="peer w-full border-b border-indigo/22 bg-transparent py-3 text-[15px] text-indigo outline-none transition-colors placeholder:text-indigo/35 aria-[invalid=true]:border-crimson"
              placeholder={locale === "ja" ? "佐々木 優子" : "Sasaki Yuko"}
            />
            <FocusLine />
          </div>
          <FieldError error={fieldErrors.name} />
        </Field>

        <Field id="contact-email" label="Email" jp="メールアドレス" required>
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
              className="peer w-full border-b border-indigo/22 bg-transparent py-3 text-[15px] text-indigo outline-none transition-colors placeholder:text-indigo/35 aria-[invalid=true]:border-crimson"
              placeholder="you@example.com"
            />
            <FocusLine />
          </div>
          <FieldError error={fieldErrors.email} />
        </Field>
      </div>

      <Field id="contact-subject" label="Subject" jp="ご用件" required>
        <div className="relative">
          <select
            id="contact-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="peer w-full appearance-none border-b border-indigo/22 bg-transparent py-3 pr-8 text-[15px] text-indigo outline-none transition-colors"
          >
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {locale === "ja" ? s.ja : s.en}
              </option>
            ))}
          </select>
          <svg
            aria-hidden
            viewBox="0 0 12 8"
            width="12"
            height="8"
            fill="none"
            className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-indigo/55"
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

      <Field id="contact-message" label="Message" jp="ご用件詳細" required>
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
            className="peer w-full resize-none border-b border-indigo/22 bg-transparent py-3 text-[15px] leading-[1.7] text-indigo outline-none transition-colors placeholder:text-indigo/35 aria-[invalid=true]:border-crimson"
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
            className={`ml-auto shrink-0 text-[11.5px] tracking-[0.14em] tabular-nums transition-colors ${
              message.length > MESSAGE_MAX * 0.9
                ? "text-gold"
                : "text-indigo/40"
            }`}
          >
            {message.length} / {MESSAGE_MAX}
          </span>
        </div>
      </Field>

      <p className="text-[11px] leading-[1.65] text-indigo/55">
        <L
          en={
            <>
              By sending, you acknowledge our{" "}
              <a
                href="/privacy"
                className="underline underline-offset-2 transition-colors hover:text-gold"
              >
                privacy policy
              </a>
              . We use your details only to reply to you — never to sell or
              rent.
            </>
          }
          ja={
            <>
              送信をもって、当社の
              <a
                href="/privacy"
                className="underline underline-offset-2 transition-colors hover:text-gold"
              >
                プライバシーポリシー
              </a>
              に同意したものとみなします。いただいた情報はご返信のためにのみ利用し、販売・貸与は行いません。
            </>
          }
        />
      </p>

      {submitError ? (
        <p
          role="alert"
          className="border border-crimson/40 bg-crimson/6 px-4 py-3 text-[12px] leading-[1.75] text-crimson"
        >
          {submitError === "rate" ? (
            <L
              en="You've sent several messages in a short time. Please wait a few minutes and try again, or email us directly."
              ja="短時間に複数回送信されています。数分おいてからもう一度お試しいただくか、メールにて直接ご連絡ください。"
            />
          ) : (
            <L
              en="We couldn't send your message. Please try again in a moment, or email us directly."
              ja="メッセージを送信できませんでした。しばらくしてからもう一度お試しいただくか、メールにて直接ご連絡ください。"
            />
          )}{" "}
          <a
            href={`mailto:${FUJISAN_LEGAL.email}`}
            className="font-semibold underline underline-offset-2"
          >
            {FUJISAN_LEGAL.email}
          </a>
        </p>
      ) : null}

      <div className="mt-1">
        <button type="submit" disabled={submitting} className="ed-btn">
          <span key={submitting ? "sending" : "idle"} className="fujisan-swap">
            {submitting ? (
              <L en="Sending…" ja="送信中…" />
            ) : (
              <L en="Send message" ja="メッセージを送る" />
            )}
          </span>
        </button>
      </div>
    </form>
  );
}

/** フォーカス時に左から伸びる金のヘアライン（input/textarea の下線に重ねる） */
function FocusLine() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gold transition-transform duration-500 peer-focus:scale-x-100"
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
        className="ed-label"
      >
        <L ja={jp} en={label} />
        {required && (
          <span aria-hidden className="ml-1 text-crimson">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
