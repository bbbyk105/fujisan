import { Suspense } from "react";
import { AuthShell, AuthHeading } from "@/components/fujisan/auth/AuthShell";
import { LoginForm } from "@/components/fujisan/auth/LoginForm";

export const metadata = {
  title: "Trade Sign In — FUJISAN SAKE",
};

export default function LoginBusinessPage() {
  return (
    <AuthShell
      role="business"
      mode="login"
      brand={{
        kanji: "取引",
        kickerJp: "― 取扱店ログイン ―",
        titleEn: "Trade access to the kura.",
        titleJp: "蔵元との、お取引へ。",
        textEn:
          "Sign in to view wholesale pricing, place case orders, and reach your dedicated trade desk — in Japanese or English.",
        textJp:
          "ログインすると、卸価格の確認・ケース単位のご注文・専任窓口へのご連絡が行えます。日本語・英語に対応します。",
        crumbHref: "/shop/business",
        crumbEn: "Back to trade",
        crumbJp: "取扱店ページへ戻る",
      }}
    >
      <AuthHeading
        role="business"
        eyebrowEn="TRADE SIGN IN"
        eyebrowJp="取扱店ログイン"
        titleEn="Sign in to your trade account."
        titleJp="取扱店アカウントにログイン。"
        leadEn="For restaurants, bars, retailers, and hospitality. Wholesale pricing is shown only to signed-in trade accounts."
        leadJp="飲食店・小売・ホスピタリティ向け。卸価格はログインした取扱店のみに表示されます。"
      />
      <Suspense>
        <LoginForm role="business" />
      </Suspense>
    </AuthShell>
  );
}
