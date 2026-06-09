import { AuthShell, AuthHeading } from "@/components/fujisan/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/fujisan/auth/ForgotPasswordForm";

export const metadata = {
  title: "Reset Trade Password — FUJISAN SAKE",
};

export default function ForgotPasswordBusinessPage() {
  return (
    <AuthShell
      role="business"
      mode="login"
      showRoleSwitch={false}
      brand={{
        kanji: "再設",
        kickerJp: "― パスワード再設定 ―",
        titleEn: "Back to your trade account.",
        titleJp: "お取引アカウントへ。",
        textEn:
          "Enter your account email and we'll send a secure link to set a new password.",
        textJp:
          "ご登録のメールアドレスをご入力ください。パスワードを再設定するための安全なリンクをお送りします。",
        crumbHref: "/login/business",
        crumbEn: "Back to trade sign in",
        crumbJp: "取扱店ログインへ戻る",
      }}
    >
      <AuthHeading
        role="business"
        eyebrowEn="RESET PASSWORD"
        eyebrowJp="パスワード再設定"
        titleEn="Forgot your password?"
        titleJp="パスワードをお忘れですか？"
        leadEn="Enter the email registered to your trade account. We'll send you a link to set a new password."
        leadJp="お取引アカウントのメールアドレスを入力してください。新しいパスワードを設定するリンクをお送りします。"
      />
      <ForgotPasswordForm role="business" />
    </AuthShell>
  );
}
