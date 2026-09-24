import Link from "next/link";
import { L } from "@/i18n/Localized";
import { AUTH_LINK_TTL_SEC, type AccountRole } from "@/lib/auth-shared";
import { AuthHeading } from "./AuthShell";

/**
 * 確認メールのリンクを踏んだあとの結果。
 *
 * Better Auth は成功時に何も付けずにリダイレクトし、失敗時は `?error=` に
 * コードを付ける。期限切れとそれ以外（壊れたリンク・削除済みのアカウント）で
 * 案内を分ける — 期限切れなら送り直せば済むが、壊れたリンクは送り直す前に
 * 「メールのリンクを開き直す」ほうが早い。
 */
export type EmailVerifiedState = "ok" | "expired" | "invalid";

export function emailVerifiedStateOf(error: string | undefined): EmailVerifiedState {
  if (!error) return "ok";
  return error === "TOKEN_EXPIRED" ? "expired" : "invalid";
}

export function EmailVerifiedView({
  role,
  state,
}: {
  role: AccountRole;
  state: EmailVerifiedState;
}) {
  const loginHref = role === "business" ? "/login/business" : "/login/personal";
  const hours = Math.round(AUTH_LINK_TTL_SEC / 3600);

  if (state === "ok") {
    return (
      <>
        <AuthHeading
          role={role}
          eyebrowEn="Email verified"
          eyebrowJp="確認完了"
          titleEn="Your email address is verified"
          titleJp="メールアドレスを確認しました"
          leadEn={
            role === "business"
              ? "Your registration is complete. Sign in with your email address and password. We'll email you once your trade application has been reviewed. Wholesale pricing appears after approval."
              : "Your registration is complete. Sign in with the email address and password you registered."
          }
          leadJp={
            role === "business"
              ? "ご登録が完了しました。登録したメールアドレスとパスワードでログインしてください。取扱店の審査の結果は、メールでお知らせします。卸価格は承認後に表示されます。"
              : "ご登録が完了しました。登録したメールアドレスとパスワードでログインしてください。"
          }
        />
        <Link href={loginHref} className="ed-btn w-full">
          <L en="Sign in" ja="ログインする" />
        </Link>
      </>
    );
  }

  return (
    <>
      {state === "expired" ? (
        <AuthHeading
          role={role}
          eyebrowEn="Link expired"
          eyebrowJp="期限切れ"
          titleEn="This link has expired"
          titleJp="確認リンクの有効期限が切れています"
          leadEn={`Verification links expire ${hours} hour${hours === 1 ? "" : "s"} after they're sent. Enter your email address and password on the sign-in page, and you can have a new link sent.`}
          leadJp={`確認メールのリンクは、送信から ${hours} 時間で使えなくなります。ログイン画面でメールアドレスとパスワードを入力すると、確認メールを送り直せます。`}
        />
      ) : (
        <AuthHeading
          role={role}
          eyebrowEn="Invalid link"
          eyebrowJp="確認できませんでした"
          titleEn="We couldn't verify this link"
          titleJp="このリンクでは確認できませんでした"
          leadEn="The link may have been cut off when it was opened. Open the link in the email again, or have a new one sent from the sign-in page."
          leadJp="リンクが途中で切れている可能性があります。メールのリンクをもう一度開くか、ログイン画面から確認メールを送り直してください。"
        />
      )}
      <Link href={loginHref} className="ed-btn w-full">
        <L en="Go to sign in" ja="ログイン画面へ" />
      </Link>
    </>
  );
}
