import FujisanInfoPage, {
  type InfoSection,
} from "@/components/fujisan/FujisanInfoPage";
import { SHIPPING_FEE } from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Shipping & Returns — FUJISAN SAKE",
  description:
    "How we ship the Fujisan collection — temperature-controlled, hand-packed — and how to handle returns or damage.",
};

const sections: InfoSection[] = [
  {
    num: "01",
    heading: <L en="Where we ship" ja="お届けできる地域" />,
    body: [
      <L
        key="b"
        en="We ship the Fujisan collection across Japan and to selected international destinations. Availability depends on local import regulations for alcoholic beverages."
        ja="国内全域および一部の海外地域へお届けいたします。配送可否は各国・地域の酒類輸入規制に従います。"
      />,
    ],
    bullets: [
      <L
        key="1"
        en={`Japan — nationwide (${SHIPPING_FEE.remoteEn})`}
        ja={`国内: 全国（${SHIPPING_FEE.remote}）`}
      />,
      <L
        key="2"
        en={`Shipping — ${SHIPPING_FEE.flatEn} / ${SHIPPING_FEE.coolEn}`}
        ja={`送料: ${SHIPPING_FEE.flat} ／ ${SHIPPING_FEE.cool}`}
      />,
      <L
        key="3"
        en="Asia — Hong Kong, Singapore, Taiwan"
        ja="アジア — 香港・シンガポール・台湾"
      />,
      <L
        key="4"
        en="EU & UK — selected countries via licenced importers"
        ja="EU・英国 — 認可輸入業者を通じた一部の国"
      />,
      <L
        key="5"
        en="United States — California, New York, Illinois"
        ja="米国 — カリフォルニア・ニューヨーク・イリノイ"
      />,
    ],
  },
  {
    num: "02",
    heading: <L en="Packing & temperature" ja="梱包と温度管理" />,
    body: [
      <L
        key="b1"
        en="Each bottle is hand-wrapped in washi paper, cushioned in moulded fibre, and packed in a chilled outer box. For overseas shipments we add a temperature buffer to keep the sake below 18°C in transit."
        ja="各ボトルは和紙で包み、モールドファイバーで保護し、保冷外箱に詰めてお届けします。海外発送では、輸送中も18℃以下に保てるよう保冷材を追加します。"
      />,
      <L
        key="b2"
        en="Daiginjo and aroma-driven bottles are dispatched on Mondays and Tuesdays only, so they avoid weekend warehouse holds."
        ja="大吟醸や香り高い銘柄は、週末の倉庫保管を避けるため、月・火曜のみの発送としています。"
      />,
    ],
  },
  {
    num: "03",
    heading: <L en="Lead times & tracking" ja="発送と追跡" />,
    body: [
      <L
        key="b"
        en="Orders are typically dispatched within two business days. You will receive a tracking link by email when your parcel leaves the brewhouse."
        ja="ご注文確認後（銀行振込の場合は入金確認後）、原則2営業日以内に発送いたします。発送後、追跡番号付きの配送通知メールをお送りします。"
      />,
    ],
    bullets: [
      <L
        key="1"
        en="Japan — 1–3 business days after dispatch"
        ja="国内: 発送から1〜3営業日でお届け"
      />,
      <L key="2" en="Asia · 3–5 business days" ja="アジア · 3〜5営業日" />,
      <L key="3" en="EU / UK · 5–8 business days" ja="EU・英国 · 5〜8営業日" />,
      <L key="4" en="United States · 5–9 business days" ja="米国 · 5〜9営業日" />,
    ],
  },
  {
    num: "04",
    heading: <L en="Receiving your order" ja="お受け取りについて" />,
    body: [
      <L
        key="b1"
        en="Drinking by anyone under the age of 20 is prohibited by law. We do not sell alcoholic beverages to anyone under the age of 20."
        ja="20歳未満の者の飲酒は法律で禁止されています。20歳未満の者には酒類を販売いたしません。"
      />,
      <L
        key="b2"
        en="An adult of legal drinking age must sign for delivery, and the carrier may verify age at the door. If no one is available, the carrier will leave a card; please re-deliver as soon as possible to keep the sake out of warm storage."
        ja="お受け取りの際は満20歳以上の方が必ずご署名・ご捺印をお願いいたします。配送業者が年齢確認を行う場合があります。ご不在の場合は不在票によりお預かり後、速やかに再配達をご依頼ください。"
      />,
    ],
  },
  {
    num: "05",
    heading: <L en="Damage & defects" ja="破損・不良品" />,
    body: [
      <L
        key="b"
        en="Photograph the outer box and the bottle as soon as you notice damage, and contact us within seven days at care@fujisan-sake.com. We will replace damaged bottles or refund the order."
        ja="破損に気づかれたら、すぐに外箱とボトルを撮影し、7日以内に care@fujisan-sake.com までご連絡ください。破損品の交換、またはご返金で対応いたします。"
      />,
    ],
  },
  {
    num: "06",
    heading: <L en="Returns" ja="返品について" />,
    body: [
      <L
        key="b"
        en="Because sake is a perishable, temperature-sensitive product, we do not accept returns of opened bottles, or of unopened bottles for change of mind. For breakage in transit, wrong items, or defects, please contact us within seven days of arrival and we will arrange a replacement or refund at our cost."
        ja="酒類は性質上、開栓後・お客様都合（イメージ違い等）による返品・交換はお受けできません。配送中の破損・誤配送・不良品については、商品到着後7日以内にメールにてご連絡ください。当社の負担にて、速やかに代替品の発送またはご返金の対応をいたします。"
      />,
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
      lead={
        <L
          en="Sake is a living product. The way it travels matters as much as the way it is brewed. Here is how we send each bottle to your door."
          ja="日本酒は生きものです。どう運ばれるかは、どう醸されるかと同じくらい大切です。一本一本をご自宅へお届けするまでの方法をご案内します。"
        />
      }
      crumb={{ label: "SHIPPING", href: "/shipping" }}
      updated="2026.04"
      sections={sections}
    />
  );
}
