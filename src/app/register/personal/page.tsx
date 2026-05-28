import { AuthShell, AuthHeading } from "@/components/fujisan/auth/AuthShell";
import { RegisterPersonalForm } from "@/components/fujisan/auth/RegisterPersonalForm";
import { isGoogleEnabled } from "@/lib/auth";

export const metadata = {
  title: "Create Account — FUJISAN SAKE",
};

export default async function RegisterPersonalPage() {
  const googleEnabled = await isGoogleEnabled();

  return (
    <AuthShell
      role="personal"
      mode="register"
      brand={{
        kanji: "登録",
        kickerJp: "― 新規会員登録 ―",
        titleEn: "A quiet place at the table.",
        titleJp: "食卓に、ひとつの居場所を。",
        textEn:
          "Create an account to save your details, keep your order history, and have Fujisan delivered with care to your door.",
        textJp:
          "アカウントを作成すると、お届け先の保存・注文履歴の管理ができ、富士山の一本をご自宅まで丁寧にお届けします。",
        crumbHref: "/shop/personal",
        crumbEn: "Back to shop",
        crumbJp: "ショップへ戻る",
      }}
    >
      <AuthHeading
        role="personal"
        eyebrowEn="CREATE ACCOUNT"
        eyebrowJp="新規会員登録"
        titleEn="Create your account."
        titleJp="アカウントを作成。"
        leadEn="For individual customers. You must be 20 or older to purchase alcohol in Japan."
        leadJp="個人のお客様向け。酒類のご購入は20歳以上の方に限ります。"
      />
      <RegisterPersonalForm googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
