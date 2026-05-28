import FujisanInfoPage, {
  type InfoSection,
} from "@/components/fujisan/FujisanInfoPage";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "FAQ — FUJISAN SAKE",
  description:
    "Answers to common questions about Fujisan sake — storing, serving, ordering, and gifting.",
};

const sections: InfoSection[] = [
  {
    num: "01",
    heading: (
      <L
        en="How should I store an unopened bottle?"
        ja="未開封のボトルはどう保管すればよいですか？"
      />
    ),
    jp: "未開封の保管",
    body: [
      <L
        key="b"
        en="Keep the bottle upright in a dark place between 5°C and 12°C. A wine fridge is ideal. Avoid direct sunlight and sudden temperature shifts — sake is sensitive to UV and heat."
        ja="直射日光を避け、5〜12℃の暗所で立てて保管してください。ワインセラーが理想的です。日本酒は紫外線と熱に弱いため、急な温度変化も避けてください。"
      />,
    ],
  },
  {
    num: "02",
    heading: (
      <L
        en="How long does sake keep once opened?"
        ja="開栓後はどれくらい日持ちしますか？"
      />
    ),
    jp: "開栓後の目安",
    body: [
      <L
        key="b"
        en="Once opened, store the bottle in the refrigerator and enjoy within seven to ten days for daiginjo and ginjo, and within two weeks for richer junmai styles. The sake will not spoil quickly, but its freshness is at its peak in the first week."
        ja="開栓後は冷蔵庫で保管し、大吟醸・吟醸は7〜10日、コクのある純米は2週間ほどを目安にお楽しみください。すぐに悪くなるわけではありませんが、最初の一週間が最も新鮮です。"
      />,
    ],
  },
  {
    num: "03",
    heading: (
      <L
        en="What is the right serving temperature?"
        ja="適切な飲み頃の温度は？"
      />
    ),
    jp: "適温",
    body: [
      <L
        key="b"
        en="Each bottle in the collection has a recommended temperature on its product page. As a starting point: aroma-driven daiginjo around 8°C, junmai chilled or lightly warmed around 40°C, and several labels enjoyable both chilled and warm."
        ja="各商品ページにおすすめの温度を記しています。目安として、香り高い大吟醸は8℃前後、純米は冷やすか40℃前後のぬる燗で。冷やでも燗でも楽しめる銘柄もあります。"
      />,
    ],
  },
  {
    num: "04",
    heading: (
      <L
        en="Which sake should I choose first?"
        ja="最初の一本はどれがおすすめ？"
      />
    ),
    jp: "はじめての一本",
    body: [
      <L
        key="b"
        en="If you are new to sake, a junmai is a generous, approachable starting point. From there, a junmai ginjo opens up the floral side of the spectrum, and a junmai daiginjo brings the perfume of the orchard."
        ja="日本酒が初めての方には、ふくらみがあり親しみやすい純米から。そこから純米吟醸で華やかな香りへ、純米大吟醸で果実のような芳香へと広げてみてください。"
      />,
    ],
  },
  {
    num: "05",
    heading: (
      <L en="Can I gift Fujisan sake?" ja="ギフトとして贈れますか？" />
    ),
    jp: "ギフトについて",
    body: [
      <L
        key="b"
        en="Yes. Each bottle ships in a presentation box wrapped in washi paper. At checkout you can add a handwritten note and request that the invoice be sent to a separate billing address."
        ja="はい。各ボトルは和紙で包んだ化粧箱でお届けします。ご購入手続きの際に、手書きのメッセージの追加や、請求書を別住所へお送りするご指定も可能です。"
      />,
    ],
  },
  {
    num: "06",
    heading: (
      <L en="Do you offer brewery visits?" ja="蔵見学はできますか？" />
    ),
    jp: "蔵見学",
    body: [
      <L
        key="b"
        en="We welcome small groups by appointment. Visits run from November through March, when the brewhouse is at work. Please write to visit@fujisan-sake.com to enquire."
        ja="ご予約制で、少人数の見学を承っております。仕込みの行われる11月〜3月に実施しています。visit@fujisan-sake.com までお問い合わせください。"
      />,
    ],
  },
  {
    num: "07",
    heading: (
      <L
        en="I work in the trade — can we discuss wholesale?"
        ja="業務用・卸の相談はできますか？"
      />
    ),
    jp: "業務用・卸",
    body: [
      <L
        key="b"
        en="We work with a small, considered list of restaurants and retailers. If our sake fits your programme, please contact trade@fujisan-sake.com with a brief introduction to your venue."
        ja="限られた数の飲食店・小売店さまとお取引しています。貴店に合いそうでしたら、お店のご紹介を添えて trade@fujisan-sake.com までご連絡ください。"
      />,
    ],
  },
  {
    num: "08",
    heading: (
      <L en="How do I reach a real person?" ja="担当者に直接連絡するには？" />
    ),
    jp: "お問い合わせ",
    body: [
      <L
        key="b"
        en="Email care@fujisan-sake.com. Our small team is in Shizuoka and replies in Japanese or English, usually within one business day."
        ja="care@fujisan-sake.com までメールをお送りください。静岡の小さなチームが、通常1営業日以内に日本語または英語でご返信します。"
      />,
    ],
  },
];

export default function FaqPage() {
  return (
    <FujisanInfoPage
      eyebrow="GUIDANCE · FAQ"
      chapter="Ⅶ"
      title="FREQUENTLY ASKED"
      jp="― よくあるご質問 ―"
      lead={
        <L
          en="A short field guide for storing, serving, and ordering Fujisan sake. If your question is not here, write to us — we read every email."
          ja="富士山の酒の保管・楽しみ方・ご注文についての、短い手引きです。お探しの答えがなければ、お気軽にご連絡ください。すべてのメールに目を通しています。"
        />
      }
      crumb={{ label: "FAQ", href: "/faq" }}
      updated="2026.04"
      sections={sections}
    />
  );
}
