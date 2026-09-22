"use client";

import { useState, type FormEvent } from "react";
import { changeMyEmailAction } from "@/lib/actions/auth";
import type { AuthErrorKey } from "@/lib/auth-errors";
import { FieldError } from "@/components/fujisan/FieldError";
import type { FieldErrorKey } from "@/lib/validation/forms";
import { L } from "@/i18n/Localized";
import { RateLimitMessage } from "./ui";

const inputCls =
  "w-full border-b border-[#0B1A2E]/25 bg-transparent py-2.5 text-[15px] text-[#0B1A2E] outline-none transition-colors placeholder:text-[#0B1A2E]/35 focus:border-[#C9A84C] aria-[invalid=true]:border-[#8B1A1A]";

/**
 * メールアドレスの変更。
 *
 * 押した時点では**まだ変わらない**。現在のアドレスへ承認リンクが届き、
 * それを踏むと新しいアドレスにも確認メールが届く。両方を踏んで初めて
 * 入れ替わる。UI でもその順番をそのまま書く — 「変更しました」とだけ出すと、
 * 受信箱を確認せずに離脱して、変わっていないことに後から気づく。
 */
export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, FieldErrorKey>>(
    {},
  );
  const [errorKey, setErrorKey] = useState<AuthErrorKey | null>(null);
  const [sameAsCurrent, setSameAsCurrent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorKey(null);
    setSameAsCurrent(false);
    setSentTo(null);

    const value = email.trim();
    const errors: Record<string, FieldErrorKey> = {};
    if (!value) errors.email = "required";
    else if (!value.includes("@")) errors.email = "email";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // 「同じアドレス」はサーバーの invalid と混ぜず、専用の文言で返す。
    if (value.toLowerCase() === currentEmail.trim().toLowerCase()) {
      setSameAsCurrent(true);
      return;
    }

    setSubmitting(true);
    const res = await changeMyEmailAction({ newEmail: value });
    setSubmitting(false);

    if (res.ok) {
      setEmail("");
      setFieldErrors({});
      setSentTo(value);
      return;
    }
    setErrorKey(res.error);
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="border border-[#0B1A2E]/12 bg-paper/65 px-7 py-8 md:px-10 md:py-10"
    >
      <h3 className="font-serif text-[16px] font-semibold tracking-[0.04em] text-[#0B1A2E]">
        <L en="Change email address" ja="メールアドレスの変更" />
      </h3>
      <p className="mt-3 max-w-[60ch] text-[12.5px] leading-[1.75] text-[#1D2432]/72">
        <L
          en={`You currently sign in with ${currentEmail}. We'll first email that address to confirm the change, then email the new address to finish it. Your address doesn't change until both links are opened.`}
          ja={`現在のログイン用アドレスは ${currentEmail} です。まずこのアドレス宛に確認のメールをお送りし、承認後に新しいアドレスへも確認メールをお送りします。両方のリンクを開いていただくまで、アドレスは変わりません。`}
        />
      </p>

      {sentTo && (
        <div
          role="status"
          className="mt-5 border border-[#5C8A5C]/45 bg-[#5C8A5C]/[0.08] px-4 py-3 text-[12.5px] leading-[1.75] text-[#2F5A2F]"
        >
          <p className="font-semibold">
            <L
              en={`Check ${currentEmail}`}
              ja={`${currentEmail} の受信箱をご確認ください`}
            />
          </p>
          <p className="mt-1.5">
            <L
              en={`We've sent a confirmation link to your current address. Open it to approve the change to ${sentTo} — we'll then email that address to finish.`}
              ja={`現在のアドレス宛に確認リンクをお送りしました。リンクを開いて ${sentTo} への変更をご承認ください。その後、新しいアドレスにも確認メールをお送りします。`}
            />
          </p>
          <p className="mt-1.5 text-[11.5px] text-[#2F5A2F]/80">
            <L
              en="If the new address is already registered to another account, no email will be sent to it."
              ja="新しいアドレスが既に他のアカウントでご登録済みの場合、そちらへのメールは送られません。"
            />
          </p>
        </div>
      )}

      {sameAsCurrent && (
        <p
          role="alert"
          className="mt-5 border border-[#8B1A1A]/40 bg-[#8B1A1A]/[0.06] px-4 py-3 text-[12.5px] leading-[1.7] text-[#8B1A1A]"
        >
          <L
            en="That's already your current email address."
            ja="現在ご登録のメールアドレスと同じです。"
          />
        </p>
      )}

      {errorKey && (
        <p
          role="alert"
          className="mt-5 border border-[#8B1A1A]/40 bg-[#8B1A1A]/[0.06] px-4 py-3 text-[12.5px] leading-[1.7] text-[#8B1A1A]"
        >
          {errorKey === "rate" ? (
            <RateLimitMessage />
          ) : errorKey === "invalid" ? (
            <L
              en="Please enter a valid email address."
              ja="メールアドレスの形式をご確認ください。"
            />
          ) : (
            <L
              en="We couldn't start the email change. Please try again."
              ja="メールアドレスの変更を開始できませんでした。もう一度お試しください。"
            />
          )}
        </p>
      )}

      <div className="mt-7 flex max-w-[420px] flex-col gap-2">
        <label
          htmlFor="new-email"
          className="text-[10px] font-semibold tracking-[0.28em] text-[#0B1A2E]/60"
        >
          <L en="NEW EMAIL ADDRESS" ja="新しいメールアドレス" />
        </label>
        <input
          id="new-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder="you@example.com"
        />
        <FieldError error={fieldErrors.email} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-8 inline-flex cursor-pointer items-center justify-center border border-[#0B1A2E] bg-[#0B1A2E] px-7 py-3.5 text-[10.5px] font-semibold tracking-[0.28em] text-paper-card transition-colors hover:bg-[#1D2432] disabled:cursor-wait disabled:opacity-60"
      >
        {submitting ? (
          <L en="SENDING…" ja="送信中…" />
        ) : (
          <L en="SEND CONFIRMATION" ja="確認メールを送る" />
        )}
      </button>
    </form>
  );
}
