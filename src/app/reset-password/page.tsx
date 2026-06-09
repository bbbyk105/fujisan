import { Suspense } from "react";
import { AuthShell, AuthHeading } from "@/components/fujisan/auth/AuthShell";
import { ResetPasswordForm } from "@/components/fujisan/auth/ResetPasswordForm";

export const metadata = {
  title: "Set a New Password — FUJISAN SAKE",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      role="personal"
      mode="login"
      showRoleSwitch={false}
      brand={{
        kanji: "再設",
        kickerJp: "― パスワード再設定 ―",
        titleEn: "Set a new password.",
        titleJp: "新しいパスワードを設定。",
        textEn:
          "Choose a new password for your account. Make it at least 8 characters.",
        textJp:
          "アカウントの新しいパスワードを設定してください。8文字以上を推奨します。",
        crumbHref: "/login/personal",
        crumbEn: "Back to sign in",
        crumbJp: "ログインへ戻る",
      }}
    >
      <AuthHeading
        role="personal"
        eyebrowEn="NEW PASSWORD"
        eyebrowJp="新しいパスワード"
        titleEn="Set your new password."
        titleJp="新しいパスワードを設定。"
        leadEn="Enter a new password below. After updating, sign in with your new password."
        leadJp="新しいパスワードを入力してください。更新後、新しいパスワードでログインできます。"
      />
      <Suspense>
        <ResetPasswordForm role="personal" />
      </Suspense>
    </AuthShell>
  );
}
