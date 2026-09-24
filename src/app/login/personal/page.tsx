import { Suspense } from "react";
import { AuthShell, AuthHeading } from "@/components/fujisan/auth/AuthShell";
import { LoginForm } from "@/components/fujisan/auth/LoginForm";
import { isGoogleEnabled } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Member Sign In",
  description:
    "個人のお客様のログインページです。",
  path: "/login/personal",
  noIndex: true,
});

export default async function LoginPersonalPage() {
  const googleEnabled = await isGoogleEnabled();

  return (
    <AuthShell
      role="personal"
      mode="login"
      brand={{
        kanji: "會員",
        kickerJp: "会員ログイン",
        titleEn: "What you can do with an account",
        titleJp: "ログインしてできること",
        textEn:
          "Order to your saved address, check your order history, and reorder the same bottle in a few steps.",
        textJp:
          "登録した住所でのご注文、注文履歴の確認、同じ銘柄の再注文ができます。",
        crumbHref: "/shop/personal",
        crumbEn: "Back to shop",
        crumbJp: "ショップへ戻る",
      }}
    >
      <AuthHeading
        role="personal"
        eyebrowEn="MEMBER SIGN IN"
        eyebrowJp="会員ログイン"
        titleEn="Sign in to your account"
        titleJp="アカウントにログイン"
        leadEn="For individual customers. Use your email and password, or continue with Google."
        leadJp="個人のお客様向け。メールアドレスとパスワード、または Google でログインできます。"
      />
      <Suspense>
        <LoginForm role="personal" googleEnabled={googleEnabled} />
      </Suspense>
    </AuthShell>
  );
}
