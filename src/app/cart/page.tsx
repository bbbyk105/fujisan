import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { FujisanInnerHero } from "@/components/fujisan/FujisanInnerHero";
import { CartView } from "@/components/fujisan/cart/CartView";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Cart — FUJISAN SAKE",
  description:
    "Review the bottles in your cart before checkout. Prices include tax; age verification at every step.",
};

// 静的に書き出し、カートの状態はクライアント（localStorage）で持つ
export const dynamic = "force-static";

export default function CartPage() {
  return (
    <main className="min-h-screen bg-[#FAF5E8] text-[#0B1A2E]">
      <FujisanNav />

      <FujisanInnerHero
        eyebrow="CART · カート"
        chapter="Ⅹ"
        title="YOUR CART."
        jp="― ご注文の確認 ―"
        lead={
          <L
            en="Review your bottles before checkout. Prices include tax, and every order is hand-checked at the kura."
            ja="お手続きの前に、お選びいただいた一本一本をご確認ください。価格は税込、すべてのご注文を蔵でひとつずつ検品します。"
          />
        }
        crumbs={[
          { label: "HOME", href: "/#top" },
          { label: "PURCHASE", href: "/shop" },
          { label: "CART", href: "/cart" },
        ]}
        bgPosition="object-[50%_42%]"
      />

      <CartView />

      <FujisanFooter />
    </main>
  );
}
