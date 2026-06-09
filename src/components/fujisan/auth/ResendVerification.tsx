"use client";

import { useState } from "react";
import { resendVerificationAction } from "@/lib/actions/auth";
import { L } from "@/i18n/Localized";

type State = "idle" | "sending" | "sent" | "error";

/**
 * メール認証リンクの再送ボタン。ログイン画面の未認証エラー時と、
 * 新規登録後の「確認メール送信済み」画面で共用する。
 */
export function ResendVerification({
  email,
  role,
}: {
  email: string;
  role: "personal" | "business";
}) {
  const [state, setState] = useState<State>("idle");

  const onResend = async () => {
    if (state === "sending" || state === "sent") return;
    setState("sending");
    const res = await resendVerificationAction({ email, role });
    setState(res.ok ? "sent" : "error");
  };

  if (state === "sent") {
    return (
      <p className="text-[12px] leading-[1.7] text-[#0B1A2E]/75">
        <L
          en="Verification email re-sent. Please check your inbox (and spam folder)."
          ja="確認メールを再送しました。受信トレイ（迷惑メールフォルダもあわせて）をご確認ください。"
        />
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={onResend}
        disabled={state === "sending"}
        className="inline-flex w-fit cursor-pointer items-center gap-2 text-[12.5px] font-semibold text-[#0B1A2E] underline decoration-[#C9A84C]/60 underline-offset-4 transition-colors hover:decoration-[#C9A84C] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "sending" ? (
          <L en="Re-sending…" ja="再送しています…" />
        ) : (
          <L en="Resend verification email" ja="確認メールを再送する" />
        )}
      </button>
      {state === "error" && (
        <p className="text-[11.5px] leading-[1.6] text-[#8B1A1A]">
          <L
            en="Could not resend. Please check the email address and try again."
            ja="再送できませんでした。メールアドレスをご確認のうえ、もう一度お試しください。"
          />
        </p>
      )}
    </div>
  );
}
