import FujisanInfoPage, {
  type InfoSection,
} from "@/components/fujisan/FujisanInfoPage";
import { SHIPPING_FEE } from "@/data/fujisan-legal";

export const metadata = {
  title: "Shipping & Returns — FUJISAN SAKE",
  description:
    "How we ship the Fujisan collection — temperature-controlled, hand-packed — and how to handle returns or damage.",
};

const sections: InfoSection[] = [
  {
    num: "01",
    heading: "Where we ship",
    jp: "配送地域",
    body: [
      "国内全域および一部の海外地域へお届けいたします。配送可否は各国・地域の酒類輸入規制に従います。",
      "We ship the Fujisan collection across Japan and to selected international destinations. Availability depends on local import regulations for alcoholic beverages.",
    ],
    bullets: [
      `国内: 全国（${SHIPPING_FEE.remote}）`,
      `送料: ${SHIPPING_FEE.flat} ／ ${SHIPPING_FEE.cool}`,
      "Asia — Hong Kong, Singapore, Taiwan",
      "EU & UK — selected countries via licenced importers",
      "United States — California, New York, Illinois",
    ],
  },
  {
    num: "02",
    heading: "Packing & temperature",
    jp: "梱包と温度管理",
    body: [
      "Each bottle is hand-wrapped in washi paper, cushioned in moulded fibre, and packed in a chilled outer box. For overseas shipments we add a temperature buffer to keep the sake below 18°C in transit.",
      "Daiginjo and aroma-driven bottles are dispatched on Mondays and Tuesdays only, so they avoid weekend warehouse holds.",
    ],
  },
  {
    num: "03",
    heading: "Lead times & tracking",
    jp: "発送と追跡",
    body: [
      "ご注文確認後（銀行振込の場合は入金確認後）、原則2営業日以内に発送いたします。発送後、追跡番号付きの配送通知メールをお送りします。",
      "Orders are typically dispatched within two business days. You will receive a tracking link by email when your parcel leaves the brewhouse.",
    ],
    bullets: [
      "国内: 発送から1〜3営業日でお届け",
      "Asia · 3–5 business days",
      "EU / UK · 5–8 business days",
      "United States · 5–9 business days",
    ],
  },
  {
    num: "04",
    heading: "Receiving your order",
    jp: "お受け取り",
    body: [
      "20歳未満の者の飲酒は法律で禁止されています。20歳未満の者には酒類を販売いたしません。",
      "お受け取りの際は満20歳以上の方が必ずご署名・ご捺印をお願いいたします。配送業者が年齢確認を行う場合があります。ご不在の場合は不在票によりお預かり後、速やかに再配達依頼をお願いいたします。",
      "An adult of legal drinking age must sign for delivery. If no one is available, the carrier will leave a card; please re-deliver as soon as possible to keep the sake out of warm storage.",
    ],
  },
  {
    num: "05",
    heading: "Damage & defects",
    jp: "破損・不良品",
    body: [
      "Photograph the outer box and the bottle as soon as you notice damage, and contact us within seven days at care@fujisan-sake.com. We will replace damaged bottles or refund the order.",
    ],
  },
  {
    num: "06",
    heading: "Returns",
    jp: "返品について",
    body: [
      "酒類は性質上、開栓後・お客様都合（イメージ違い等）による返品・交換はお受けできません。配送中の破損・誤配送・不良品については、商品到着後7日以内にメールにてご連絡ください。当社の負担にて速やかに代替品の発送または返金の対応をいたします。",
      "Because sake is a perishable, temperature-sensitive product, we do not accept returns of opened bottles or of unopened bottles for change of mind. Where the law guarantees a right of return, we will of course honour it.",
    ],
  },
];

export default function ShippingPage() {
  return (
    <FujisanInfoPage
      eyebrow="ORDERING · SHIPPING"
      chapter="Ⅵ"
      title="SHIPPING & RETURNS"
      jp="― お届けと返品 ―"
      lead="Sake is a living product. The way it travels matters as much as the way it is brewed. Here is how we send each bottle to your door."
      crumb={{ label: "SHIPPING", href: "/shipping" }}
      updated="2026.04"
      sections={sections}
    />
  );
}
