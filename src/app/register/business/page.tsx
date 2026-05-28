import { AuthShell, AuthHeading } from "@/components/fujisan/auth/AuthShell";
import { RegisterBusinessForm } from "@/components/fujisan/auth/RegisterBusinessForm";

export const metadata = {
  title: "Open a Trade Account — FUJISAN SAKE",
};

export default function RegisterBusinessPage() {
  return (
    <AuthShell
      role="business"
      mode="register"
      brand={{
        kanji: "法人",
        kickerJp: "― 取扱店 新規登録 ―",
        titleEn: "Pour Fujisan, with the kura behind it.",
        titleJp: "蔵を背負った一本を、貴店へ。",
        textEn:
          "Open a trade account to see wholesale pricing and order by the case. Tell us about your business — the trade desk takes it from there.",
        textJp:
          "取扱店アカウントを作成すると、卸価格の確認とケース単位のご注文が可能になります。貴店の情報をご登録ください。",
        crumbHref: "/shop/business",
        crumbEn: "Back to trade",
        crumbJp: "取扱店ページへ戻る",
      }}
    >
      <AuthHeading
        role="business"
        eyebrowEn="OPEN A TRADE ACCOUNT"
        eyebrowJp="取扱店 新規登録"
        titleEn="Open your trade account."
        titleJp="取扱店アカウントを作成。"
        leadEn="For restaurants, bars, retailers, and hospitality. Wholesale pricing appears once you're signed in."
        leadJp="飲食店・小売・ホスピタリティ向け。ログイン後に卸価格が表示されます。"
      />
      <RegisterBusinessForm />
    </AuthShell>
  );
}
