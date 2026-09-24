import { Suspense } from "react";
import { AuthShell, AuthHeading } from "@/components/fujisan/auth/AuthShell";
import { LoginForm } from "@/components/fujisan/auth/LoginForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Trade Sign In",
  description:
    "取扱店さまのログインページです。",
  path: "/login/business",
  noIndex: true,
});

export default function LoginBusinessPage() {
  return (
    <AuthShell
      role="business"
      mode="login"
      brand={{
        kanji: "取引",
        kickerJp: "取扱店ログイン",
        titleEn: "For trade accounts",
        titleJp: "取扱店の方へ",
        textEn:
          "Sign in to view wholesale pricing. Orders are arranged after a quote, in Japanese or English.",
        textJp:
          "ログインすると、卸価格をご覧いただけます。ご注文はお見積りのうえで承ります。日本語・英語でご相談いただけます。",
        crumbHref: "/shop/business",
        crumbEn: "Back to trade",
        crumbJp: "取扱店ページへ戻る",
      }}
    >
      <AuthHeading
        role="business"
        eyebrowEn="TRADE SIGN IN"
        eyebrowJp="取扱店ログイン"
        titleEn="Sign in to your trade account"
        titleJp="取扱店アカウントにログイン"
        leadEn="For restaurants, bars, shops, and hotels. Wholesale pricing is shown only to approved trade accounts."
        leadJp="飲食店・小売店・宿泊施設の方向けです。卸価格は、審査の済んだ取扱店にだけ表示されます。"
      />
      <Suspense>
        <LoginForm role="business" />
      </Suspense>
    </AuthShell>
  );
}
