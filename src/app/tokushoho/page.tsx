import FujisanInfoPage, {
  type InfoSection,
} from "@/components/fujisan/FujisanInfoPage";
import { FUJISAN_LEGAL, UNDERAGE_NOTICE_JP } from "@/data/fujisan-legal";

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
    body: UNDERAGE_NOTICE_JP.map((line) => line),
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
    body: [FUJISAN_LEGAL.address],
  },
  {
    num: "04",
    heading: "Contact · お問い合わせ",
    jp: "電話番号・メールアドレス",
    body: [
      `電話番号: ${FUJISAN_LEGAL.phone}（${FUJISAN_LEGAL.phoneHours}）`,
      `メールアドレス: ${FUJISAN_LEGAL.email}`,
      "メールでのお問い合わせは原則3営業日以内にご返信いたします。",
    ],
  },
  {
    num: "05",
    heading: "Selling price · 販売価格",
    jp: "販売価格",
    body: [FUJISAN_LEGAL.priceNote],
  },
  {
    num: "06",
    heading: "Other charges · 商品代金以外の必要料金",
    jp: "商品代金以外の必要料金",
    body: [FUJISAN_LEGAL.otherFees],
    bullets: [
      `送料: ${FUJISAN_LEGAL.shippingFeeNote}`,
      "代引手数料: 330円（税込）／ご注文時",
      "銀行振込手数料: お客様負担",
    ],
  },
  {
    num: "07",
    heading: "Payment methods · お支払方法",
    jp: "お支払方法",
    body: [FUJISAN_LEGAL.paymentMethods],
  },
  {
    num: "08",
    heading: "Payment timing · お支払時期",
    jp: "お支払時期",
    body: [FUJISAN_LEGAL.paymentTiming],
  },
  {
    num: "09",
    heading: "Delivery · 商品引渡時期",
    jp: "商品引渡時期",
    body: [FUJISAN_LEGAL.deliveryTiming],
  },
  {
    num: "10",
    heading: "Returns · 返品・交換について",
    jp: "返品・交換条件",
    body: [FUJISAN_LEGAL.returnsPolicy],
  },
  {
    num: "11",
    heading: "Liquor sales licence · 酒類販売業免許",
    jp: "通信販売酒類小売業免許",
    body: [FUJISAN_LEGAL.liquorLicense],
  },
  {
    num: "12",
    heading: "Liquor sales manager · 酒類販売管理者標識",
    jp: "酒類販売管理者",
    body: [
      "酒税法第86条の9に基づき、以下の通り標識を掲示いたします。",
    ],
    bullets: [
      `販売場の名称: ${m.storeName}`,
      `販売場の所在地: ${m.storeAddress}`,
      `酒類販売管理者の氏名: ${m.managerName}`,
      `酒類販売管理研修受講年月日: ${m.trainingDate}`,
      `次回研修受講期限: ${m.nextTrainingDeadline}`,
      `研修実施団体名: ${m.trainingProvider}`,
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
      lead="特定商取引に関する法律第11条（通信販売についての広告）に基づき、当オンラインショップにおける販売条件・事業者情報・酒類販売関連免許情報を以下に開示いたします。"
      crumb={{ label: "特定商取引法", href: "/tokushoho" }}
      updated="2026.05"
      sections={sections}
    />
  );
}
