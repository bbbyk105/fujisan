import { AuthShell, AuthHeading } from "@/components/fujisan/auth/AuthShell";
import { RegisterPersonalForm } from "@/components/fujisan/auth/RegisterPersonalForm";
import { isGoogleEnabled } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Create Account",
  description:
    "個人のお客様の新規登録ページです。",
  path: "/register/personal",
  noIndex: true,
});

export default async function RegisterPersonalPage() {
  const googleEnabled = await isGoogleEnabled();

  return (
    <AuthShell
      role="personal"
      mode="register"
      brand={{
        kanji: "登録",
        kickerJp: "新規会員登録",
        titleEn: "What an account gives you",
        titleJp: "会員登録でできること",
        textEn:
          "Save your delivery address so you can skip it next time, and see your order history any time.",
        textJp:
          "お届け先を登録しておくと、次回から住所の入力を省けます。注文履歴もいつでも確認できます。",
        crumbHref: "/shop/personal",
        crumbEn: "Back to shop",
        crumbJp: "ショップへ戻る",
      }}
    >
      <AuthHeading
        role="personal"
        eyebrowEn="CREATE ACCOUNT"
        eyebrowJp="新規会員登録"
        titleEn="Create your account"
        titleJp="アカウントを作成"
        leadEn="For individual customers. You must be 20 or older to purchase alcohol in Japan."
        leadJp="個人のお客様向けです。酒類のご購入は20歳以上の方に限ります。"
      />
      <RegisterPersonalForm googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
