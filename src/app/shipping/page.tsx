import DocumentPage, {
  type DocumentSection,
} from "@/components/fujisan/editorial/DocumentPage";
import { FUJISAN_LEGAL, SHIPPING_FEE } from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Shipping & Returns",
  description:
    "How we ship the Fujisan collection — temperature-controlled, hand-packed — and how to handle returns or damage.",
  path: "/shipping",
});

const sections: DocumentSection[] = [
  {
    num: "01",
    heading: <L en="Where we ship" ja="お届けできる地域" />,
    body: [
      <L
        key="b"
        en="Orders placed on this site ship within Japan only. Delivery outside Japan cannot be arranged through checkout. Please contact us and we will discuss the options with you directly."
        ja="当サイトからのご注文は、日本国内にのみお届けします。海外へのお届けは購入手続きからはお受けできないため、お問い合わせフォームからご相談ください。"
      />,
    ],
    bullets: [
      <L
        key="1"
        en={`Japan: nationwide (${SHIPPING_FEE.remoteEn})`}
        ja={`国内: 全国（${SHIPPING_FEE.remote}）`}
      />,
      <L
        key="2"
        en={`Shipping: ${SHIPPING_FEE.flatEn} / ${SHIPPING_FEE.freeEn}`}
        ja={`送料: ${SHIPPING_FEE.flat} ／ ${SHIPPING_FEE.free}`}
      />,
      <L
        key="3"
        en="Outside Japan: by arrangement only; please enquire"
        ja="海外: お問い合わせのうえ、個別に対応します"
      />,
    ],
  },
  {
    num: "02",
    heading: <L en="Packing & temperature" ja="梱包と温度管理" />,
    body: [
      <L
        key="b1"
        en="Each bottle is hand-wrapped in washi paper, cushioned in moulded fibre, and packed in a chilled outer box so the sake stays below 18°C in transit."
        ja="各ボトルは和紙で包み、モールドファイバーで保護し、保冷外箱に詰めてお届けします。輸送中も18℃以下に保てるよう梱包しています。"
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
        ja="ご注文確認後、原則2営業日以内に発送いたします。発送後、追跡番号付きの配送通知メールをお送りします。"
      />,
    ],
    bullets: [
      <L
        key="1"
        en="Japan: 1–3 business days after dispatch"
        ja="国内: 発送から1〜3営業日でお届け"
      />,
      <L
        key="2"
        en="Hokkaido, Okinawa and remote islands: allow an extra day"
        ja="北海道・沖縄・離島: さらに1日ほど頂戴する場合があります"
      />,
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
        ja="お受け取り（サインまたは押印）は、20歳以上の方にお願いしています。配送業者が年齢を確認する場合があります。ご不在で不在票が入っていたときは、お酒が暖かい場所に置かれたままにならないよう、早めに再配達をご依頼ください。"
      />,
    ],
  },
  {
    num: "05",
    heading: <L en="Damage & defects" ja="破損・不良品" />,
    body: [
      <L
        key="b"
        en={`Photograph the outer box and the bottle as soon as you notice damage, and contact us within seven days at ${FUJISAN_LEGAL.email}. We will replace damaged bottles or refund the order.`}
        ja={`破損に気づかれたら、すぐに外箱とボトルを撮影し、7日以内に ${FUJISAN_LEGAL.email} までご連絡ください。破損品の交換、またはご返金で対応いたします。`}
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
    <DocumentPage
      kicker={<L en="Ordering" ja="ご注文" />}
      title={<L en="Shipping & Returns" ja="お届けと返品" />}
      lead={
        <L
          en="Where we ship, how we pack, delivery times, receiving your order, and what to do about damage or returns."
          ja="お届けできる地域、梱包、発送までの日数、お受け取り、破損や返品のときの対応をまとめています。"
        />
      }
      updated="2026.09"
      sections={sections}
    />
  );
}
