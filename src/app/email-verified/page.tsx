import { AuthShell } from "@/components/fujisan/auth/AuthShell";
import {
  EmailVerifiedView,
  emailVerifiedStateOf,
} from "@/components/fujisan/auth/EmailVerifiedView";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Email Verified",
  description: "メールアドレスの確認結果のページです。",
  path: "/email-verified",
  noIndex: true,
});

/**
 * 確認メールのリンクの戻り先（`emailVerifiedCallbackURL`）。
 * 確認そのものは Better Auth の `/api/auth/verify-email` が済ませており、
 * ここは結果を見せてログインへ案内するだけ。
 */
export default async function EmailVerifiedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const role = params.role === "business" ? "business" : "personal";
  const error = typeof params.error === "string" ? params.error : undefined;

  return (
    <AuthShell
      role={role}
      mode="login"
      showRoleSwitch={false}
      brand={
        role === "business"
          ? {
              kanji: "取引",
              kickerJp: "取扱店のご登録",
              titleEn: "For trade accounts",
              titleJp: "取扱店の方へ",
              textEn:
                "Once your application is approved, sign in to view wholesale pricing. Orders are arranged after a quote.",
              textJp:
                "審査が済むと、ログインして卸価格をご覧いただけます。ご注文はお見積りのうえで承ります。",
              crumbHref: "/shop/business",
              crumbEn: "Back to trade",
              crumbJp: "取扱店ページへ戻る",
            }
          : {
              kanji: "会員",
              kickerJp: "会員登録",
              titleEn: "What you can do with an account",
              titleJp: "ログインしてできること",
              textEn:
                "Order to your saved address, check your order history, and reorder the same bottle in a few steps.",
              textJp:
                "登録した住所でのご注文、注文履歴の確認、同じ銘柄の再注文ができます。",
              crumbHref: "/shop/personal",
              crumbEn: "Back to shop",
              crumbJp: "ショップへ戻る",
            }
      }
    >
      <EmailVerifiedView role={role} state={emailVerifiedStateOf(error)} />
    </AuthShell>
  );
}
