import { AuthShell, AuthHeading } from "@/components/fujisan/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/fujisan/auth/ForgotPasswordForm";

export const metadata = {
  title: "Reset Password — FUJISAN SAKE",
};

export default function ForgotPasswordPersonalPage() {
  return (
    <AuthShell
      role="personal"
      mode="login"
      showRoleSwitch={false}
      brand={{
        kanji: "再設",
        kickerJp: "― パスワード再設定 ―",
        titleEn: "Locked out? We'll send you a way back in.",
        titleJp: "もう一度、ふもとへ。",
        textEn:
          "Enter your email and we'll send a secure link to set a new password.",
        textJp:
          "ご登録のメールアドレスをご入力ください。パスワードを再設定するための安全なリンクをお送りします。",
        crumbHref: "/login/personal",
        crumbEn: "Back to sign in",
        crumbJp: "ログインへ戻る",
      }}
    >
      <AuthHeading
        role="personal"
        eyebrowEn="RESET PASSWORD"
        eyebrowJp="パスワード再設定"
        titleEn="Forgot your password?"
        titleJp="パスワードをお忘れですか？"
        leadEn="Enter the email you registered with. We'll send you a link to set a new password."
        leadJp="ご登録のメールアドレスを入力してください。新しいパスワードを設定するリンクをお送りします。"
      />
      <ForgotPasswordForm role="personal" />
    </AuthShell>
  );
}
