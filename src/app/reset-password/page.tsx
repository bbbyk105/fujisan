import { Suspense } from "react";
import { AuthShell, AuthHeading } from "@/components/fujisan/auth/AuthShell";
import { ResetPasswordForm } from "@/components/fujisan/auth/ResetPasswordForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Set a New Password",
  description:
    "新しいパスワードの設定ページです。",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <AuthShell
      role="personal"
      mode="login"
      showRoleSwitch={false}
      brand={{
        crumbHref: "/login/personal",
        crumbEn: "Back to sign in",
        crumbJp: "ログインへ戻る",
      }}
    >
      <AuthHeading
        titleEn="Set your new password"
        titleJp="新しいパスワードを設定"
        leadEn="Enter a new password below. After updating, sign in with your new password."
        leadJp="新しいパスワードを入力してください。更新後、新しいパスワードでログインできます。"
      />
      <Suspense>
        <ResetPasswordForm role="personal" />
      </Suspense>
    </AuthShell>
  );
}
