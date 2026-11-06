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
        panel: {
          titleEn: "What you can do with an account",
          titleJp: "ログインしてできること",
          textEn:
            "Order to your saved address, check your order history, and reorder the same bottle in a few steps.",
          textJp:
            "登録した住所でのご注文、注文履歴の確認、同じ銘柄の再注文ができます。",
        },
        crumbHref: "/shop/personal",
        crumbEn: "Back to shop",
        crumbJp: "ショップへ戻る",
      }}
    >
      <AuthHeading
        titleEn="Sign in to your account"
        titleJp="アカウントにログイン"
      />
      <Suspense>
        <LoginForm role="personal" googleEnabled={googleEnabled} />
      </Suspense>
    </AuthShell>
  );
}
