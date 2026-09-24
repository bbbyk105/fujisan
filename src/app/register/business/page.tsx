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
        kanji: "法人",
        kickerJp: "法人・取扱店",
        titleEn: "Opening a trade account",
        titleJp: "取扱店の登録",
        textEn:
          "Once your account is approved, you can view wholesale pricing. We reply to every application within two business days.",
        textJp:
          "審査のうえ承認されると、卸価格をご覧いただけます。審査の結果は2営業日以内にご連絡します。",
        crumbHref: "/shop/business",
        crumbEn: "Back to trade",
        crumbJp: "取扱店ページへ戻る",
      }}
    >
      <AuthHeading
        role="business"
        eyebrowEn="OPEN A TRADE ACCOUNT"
        eyebrowJp="取扱店 新規登録"
        titleEn="Open your trade account"
        titleJp="取扱店アカウントを作成"
        leadEn="For restaurants, bars, shops, and hotels. Once your account is approved, wholesale pricing appears when you sign in."
        leadJp="飲食店・小売店・宿泊施設の方向けです。審査が済むと、ログイン後に卸価格が表示されます。"
      />
      <RegisterBusinessForm />
    </AuthShell>
  );
}
