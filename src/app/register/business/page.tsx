import { AuthShell, AuthHeading } from "@/components/fujisan/auth/AuthShell";
import { RegisterBusinessForm } from "@/components/fujisan/auth/RegisterBusinessForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Open a Trade Account",
  description:
    "取扱店さまの新規登録ページです。",
  path: "/register/business",
  noIndex: true,
});

export default function RegisterBusinessPage() {
  return (
    <AuthShell
      role="business"
      mode="register"
      brand={{
        panel: {
          titleEn: "Opening a trade account",
          titleJp: "取扱店の登録",
          textEn:
            "Orders are arranged after a quote, in Japanese or English.",
          textJp:
            "ご注文はお見積りのうえで承ります。日本語・英語でご相談いただけます。",
        },
        crumbHref: "/shop/business",
        crumbEn: "Back to trade",
        crumbJp: "取扱店ページへ戻る",
      }}
    >
      <AuthHeading
        titleEn="Open your trade account"
        titleJp="取扱店アカウントを作成"
        leadEn="For restaurants, bars, shops, and hotels. Once your account is approved, you can view wholesale pricing. We reply to every application within two business days."
        leadJp="飲食店・小売店・宿泊施設の方向けです。審査のうえ承認されると、卸価格をご覧いただけます。審査の結果は2営業日以内にご連絡します。"
      />
      <RegisterBusinessForm />
    </AuthShell>
  );
}
