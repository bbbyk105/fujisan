import { Suspense } from "react";
import { AuthShell, AuthHeading } from "@/components/fujisan/auth/AuthShell";
import { LoginForm } from "@/components/fujisan/auth/LoginForm";
import { isGoogleEnabled } from "@/lib/auth";

export const metadata = {
  title: "Member Sign In — FUJISAN SAKE",
};

export default async function LoginPersonalPage() {
  const googleEnabled = await isGoogleEnabled();

  return (
    <AuthShell
      role="personal"
      mode="login"
      brand={{
        kanji: "會員",
        kickerJp: "― 会員ログイン ―",
        titleEn: "Welcome back to the foot of the mountain.",
        titleJp: "ふもとへ、おかえりなさい。",
        textEn:
          "Sign in to revisit saved addresses, follow your orders, and reorder the bottles you love — fewer steps, every time.",
        textJp:
          "ログインすると、登録した住所やご注文の履歴を引き継ぎ、お気に入りの一本をかんたんに再注文いただけます。",
        crumbHref: "/shop/personal",
        crumbEn: "Back to shop",
        crumbJp: "ショップへ戻る",
      }}
    >
      <AuthHeading
        role="personal"
        eyebrowEn="MEMBER SIGN IN"
        eyebrowJp="会員ログイン"
        titleEn="Sign in to your account."
        titleJp="アカウントにログイン。"
        leadEn="For individual customers. Use your email and password, or continue with Google."
        leadJp="個人のお客様向け。メールアドレスとパスワード、または Google でログインできます。"
      />
      <Suspense>
        <LoginForm role="personal" googleEnabled={googleEnabled} />
      </Suspense>
    </AuthShell>
  );
}
