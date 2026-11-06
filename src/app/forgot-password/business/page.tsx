import { AuthShell, AuthHeading } from "@/components/fujisan/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/fujisan/auth/ForgotPasswordForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Reset Trade Password",
  description:
    "取扱店さま向けのパスワード再設定ページです。",
  path: "/forgot-password/business",
  noIndex: true,
});

export default function ForgotPasswordBusinessPage() {
  return (
    <AuthShell
      role="business"
      mode="login"
      showRoleSwitch={false}
      brand={{
        crumbHref: "/login/business",
        crumbEn: "Back to trade sign in",
        crumbJp: "取扱店ログインへ戻る",
        panel: {
          titleEn: "Trade customers",
          titleJp: "法人・取扱店のお客様",
          textEn: "If you can't recall your email address, please contact us.",
          textJp: "メールアドレスが分からない場合は、お問い合わせください。",
        },
      }}
    >
      <AuthHeading
        titleEn="Forgot your password?"
        titleJp="パスワードの再設定"
        leadEn="Enter the email registered to your trade account. We'll send you a link to set a new password."
        leadJp="取扱店アカウントのメールアドレスを入力してください。新しいパスワードを設定するリンクをお送りします。"
      />
      <ForgotPasswordForm role="business" />
    </AuthShell>
  );
}
