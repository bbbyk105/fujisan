import FujisanInfoPage, {
  type InfoSection,
} from "@/components/fujisan/FujisanInfoPage";
import {
  FUJISAN_LEGAL,
  UNDERAGE_NOTICE_JP,
  UNDERAGE_NOTICE_EN,
} from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "特定商取引法に基づく表示 — FUJISAN SAKE",
  description:
    "FUJISAN SAKE オンラインショップ における特定商取引法に基づく表示、酒類販売管理者標識、通信販売酒類小売業免許情報。",
};

const m = FUJISAN_LEGAL.liquorManager;

const sections: InfoSection[] = [
  {
    num: "00",
    heading: "Underage drinking · 20歳未満の方へ",
    jp: "未成年飲酒防止",
    body: [
      <L key="0" en={UNDERAGE_NOTICE_EN[0]} ja={UNDERAGE_NOTICE_JP[0]} />,
      <L key="1" en={UNDERAGE_NOTICE_EN[1]} ja={UNDERAGE_NOTICE_JP[1]} />,
    ],
  },
  {
    num: "01",
    heading: "Seller · 販売業者",
    jp: "販売業者",
    body: [FUJISAN_LEGAL.sellerName],
  },
  {
    num: "02",
    heading: "Representative · 代表責任者",
    jp: "運営統括責任者",
    body: [FUJISAN_LEGAL.representative, FUJISAN_LEGAL.ecManager],
  },
  {
    num: "03",
    heading: "Address · 所在地",
    jp: "所在地",
    body: [
      <L key="a" en={FUJISAN_LEGAL.addressEn} ja={FUJISAN_LEGAL.address} />,
    ],
  },
  {
    num: "04",
    heading: "Contact · お問い合わせ",
    jp: "電話番号・メールアドレス",
    body: [
      <L
        key="0"
        en={`Phone: ${FUJISAN_LEGAL.phone} (Weekdays 10:00–17:00 JST, excl. weekends & holidays)`}
        ja={`電話番号: ${FUJISAN_LEGAL.phone}（${FUJISAN_LEGAL.phoneHours}）`}
      />,
      <L
        key="1"
        en={`Email: ${FUJISAN_LEGAL.email}`}
        ja={`メールアドレス: ${FUJISAN_LEGAL.email}`}
      />,
      <L
        key="2"
        en="We reply to email enquiries within three business days as a rule."
        ja="メールでのお問い合わせは原則3営業日以内にご返信いたします。"
      />,
    ],
  },
  {
    num: "05",
    heading: "Selling price · 販売価格",
    jp: "販売価格",
    body: [
      <L
        key="p"
        en="The amount shown on each product page (10% consumption tax included). Fees such as shipping and cash-on-delivery may apply in addition to the listed price."
        ja={FUJISAN_LEGAL.priceNote}
      />,
    ],
  },
  {
    num: "06",
    heading: "Other charges · 商品代金以外の必要料金",
    jp: "商品代金以外の必要料金",
    body: [
      <L
        key="o"
        en="The cool-chain surcharge, cash-on-delivery fee, and bank transfer fees are borne by the customer."
        ja={FUJISAN_LEGAL.otherFees}
      />,
    ],
    bullets: [
      <L
        key="1"
        en={`Shipping: ${FUJISAN_LEGAL.shippingFeeNoteEn}`}
        ja={`送料: ${FUJISAN_LEGAL.shippingFeeNote}`}
      />,
      <L
        key="2"
        en="Cash on delivery: ¥330 (tax incl.) per order"
        ja="代引手数料: 330円（税込）／ご注文時"
      />,
      <L
        key="3"
        en="Bank transfer fee: borne by the customer"
        ja="銀行振込手数料: お客様負担"
      />,
    ],
  },
  {
    num: "07",
    heading: "Payment methods · お支払方法",
    jp: "お支払方法",
    body: [
      <L
        key="p"
        en={FUJISAN_LEGAL.paymentMethodsEn}
        ja={FUJISAN_LEGAL.paymentMethods}
      />,
    ],
  },
  {
    num: "08",
    heading: "Payment timing · お支払時期",
    jp: "お支払時期",
    body: [
      <L
        key="p"
        en={FUJISAN_LEGAL.paymentTimingEn}
        ja={FUJISAN_LEGAL.paymentTiming}
      />,
    ],
  },
  {
    num: "09",
    heading: "Delivery · 商品引渡時期",
    jp: "商品引渡時期",
    body: [
      <L
        key="d"
        en={FUJISAN_LEGAL.deliveryTimingEn}
        ja={FUJISAN_LEGAL.deliveryTiming}
      />,
    ],
  },
  {
    num: "10",
    heading: "Returns · 返品・交換について",
    jp: "返品・交換条件",
    body: [
      <L
        key="r"
        en="Due to the nature of alcoholic beverages, we cannot accept returns or exchanges of opened bottles, or returns for change of mind. For breakage in transit, wrong delivery, or defects, please contact us by email within 7 days of arrival; we will arrange a replacement or refund at our cost."
        ja={FUJISAN_LEGAL.returnsPolicy}
      />,
    ],
  },
  {
    num: "11",
    heading: "Liquor sales licence · 酒類販売業免許",
    jp: "通信販売酒類小売業免許",
    body: [
      <L
        key="l"
        en="Mail-order liquor retail licence (issued by the [TBD] Tax Office, Liquor Directive No. [TBD])"
        ja={FUJISAN_LEGAL.liquorLicense}
      />,
    ],
  },
  {
    num: "12",
    heading: "Liquor sales manager · 酒類販売管理者標識",
    jp: "酒類販売管理者",
    body: [
      <L
        key="i"
        en="Pursuant to Article 86-9 of the Liquor Tax Act, the sales manager notice is posted as follows."
        ja="酒税法第86条の9に基づき、以下の通り標識を掲示いたします。"
      />,
    ],
    bullets: [
      <L key="1" en={`Premises name: ${m.storeName}`} ja={`販売場の名称: ${m.storeName}`} />,
      <L
        key="2"
        en={`Premises address: ${m.storeAddress}`}
        ja={`販売場の所在地: ${m.storeAddress}`}
      />,
      <L
        key="3"
        en={`Sales manager: ${m.managerName}`}
        ja={`酒類販売管理者の氏名: ${m.managerName}`}
      />,
      <L
        key="4"
        en={`Manager training completed: ${m.trainingDate}`}
        ja={`酒類販売管理研修受講年月日: ${m.trainingDate}`}
      />,
      <L
        key="5"
        en={`Next training due: ${m.nextTrainingDeadline}`}
        ja={`次回研修受講期限: ${m.nextTrainingDeadline}`}
      />,
      <L
        key="6"
        en={`Training provider: ${m.trainingProvider}`}
        ja={`研修実施団体名: ${m.trainingProvider}`}
      />,
    ],
  },
];

export default function TokushohoPage() {
  return (
    <FujisanInfoPage
      eyebrow="LEGAL · 特定商取引法"
      chapter="Ⅶ"
      title="LEGAL NOTICE"
      jp="― 特定商取引法に基づく表示 ―"
      lead={
        <L
          en="In accordance with Article 11 of the Act on Specified Commercial Transactions (advertising for mail-order sales), the sale conditions, business information, and liquor-related licence details for this online shop are disclosed below."
          ja="特定商取引に関する法律第11条（通信販売についての広告）に基づき、当オンラインショップにおける販売条件・事業者情報・酒類販売関連免許情報を以下に開示いたします。"
        />
      }
      crumb={{ label: "特定商取引法", href: "/tokushoho" }}
      updated="2026.05"
      sections={sections}
    />
  );
}
