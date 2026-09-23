import { EditorialPage } from "@/components/fujisan/editorial/EditorialPage";
import { EditorialPageHeader } from "@/components/fujisan/editorial/EditorialPageHeader";
import { CartView } from "@/components/fujisan/cart/CartView";
import { L } from "@/i18n/Localized";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Cart",
  description:
    "Review the bottles in your cart before checkout. Prices include tax; age verification at every step.",
  path: "/cart",
  noIndex: true,
});

// 静的に書き出し、カートの状態はクライアント（localStorage）で持つ
export const dynamic = "force-static";

export default function CartPage() {
  return (
    <EditorialPage className="flex flex-col">
      <EditorialPageHeader
        kicker={<L en="Purchase" ja="ご購入" />}
        title={<L en="Your cart" ja="カート" />}
        lead={
          <L
            en="Review your bottles before checkout. Prices include tax, and every order is checked by hand before it ships."
            ja="お手続きの前に、お選びいただいた一本一本をご確認ください。価格は税込、すべてのご注文をひとつずつ検品します。"
          />
        }
      />

      <CartView />
    </EditorialPage>
  );
}
