import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { FujisanInnerHero } from "@/components/fujisan/FujisanInnerHero";
import { CheckoutView } from "@/components/fujisan/cart/CheckoutView";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Checkout — FUJISAN SAKE",
  description:
    "Confirm your shipping details and age (20+) to complete your order.",
};

// 静的に書き出し、カート・フォームの状態はクライアントで持つ
export const dynamic = "force-static";

export default function CheckoutPage() {
  return (
    <main className="min-h-screen bg-[#FAF5E8] text-[#0B1A2E]">
      <FujisanNav />

      <FujisanInnerHero
        eyebrow="CHECKOUT · ご購入手続き"
        chapter="Ⅹ.Ⅰ"
        title="COMPLETE YOUR ORDER."
        jp="― お届け先と年齢のご確認 ―"
        lead={
          <L
            en="A few details to ship your bottles, and one more age check. Prices include tax; shipping is flat-rate nationwide."
            ja="お届けに必要な情報と、年齢のご確認をお願いします。価格は税込、送料は全国一律です。"
          />
        }
        crumbs={[
          { label: "HOME", href: "/#top" },
          { label: "CART", href: "/cart" },
          { label: "CHECKOUT", href: "/checkout" },
        ]}
        bgPosition="object-[50%_42%]"
      />

      <CheckoutView />

      <FujisanFooter />
    </main>
  );
}
