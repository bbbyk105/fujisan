import { AuthShell, AuthHeading } from "@/components/fujisan/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/fujisan/auth/ForgotPasswordForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Reset Password",
  description:
    "パスワード再設定メールの送信ページです。",
  path: "/forgot-password/personal",
  noIndex: true,
});

export default function ForgotPasswordPersonalPage() {
  return (
    <AuthShell
      role="personal"
      mode="login"
      showRoleSwitch={false}
      brand={{
        crumbHref: "/login/personal",
        crumbEn: "Back to sign in",
        crumbJp: "ログインへ戻る",
        panel: {
          titleEn: "Personal customers",
          titleJp: "個人のお客様",
          textEn: "If you can't recall your email address, please contact us.",
          textJp: "メールアドレスが分からない場合は、お問い合わせください。",
        },
      }}
    >
      <AuthHeading
        titleEn="Forgot your password?"
        titleJp="パスワードをお忘れですか？"
        leadEn="Enter the email for your personal account. We'll send you a link to set a new password."
        leadJp="個人アカウントのメールアドレスを入力してください。新しいパスワードを設定するリンクをお送りします。"
      />
      <ForgotPasswordForm role="personal" />
    </AuthShell>
  );
}
