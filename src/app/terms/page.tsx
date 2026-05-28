import FujisanInfoPage, {
  type InfoSection,
} from "@/components/fujisan/FujisanInfoPage";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Terms of Use — FUJISAN SAKE",
  description:
    "The terms governing your use of fujisan-sake.com and the purchase of FUJISAN SAKE products.",
};

const sections: InfoSection[] = [
  {
    num: "01",
    heading: <L en="Acceptance" ja="ご同意" />,
    body: [
      <L
        key="b"
        en="By accessing fujisan-sake.com or placing an order, you agree to these Terms of Use. If you do not agree, please do not use the site."
        ja="fujisan-sake.com のご利用、またはご注文をもって、本利用規約に同意いただいたものとみなします。ご同意いただけない場合は、本サイトのご利用をお控えください。"
      />,
    ],
  },
  {
    num: "02",
    heading: <L en="Age & jurisdiction" ja="年齢・販売地域" />,
    body: [
      <L
        key="b1"
        en="Drinking by anyone under the age of 20 is prohibited by law. We do not sell alcoholic beverages to anyone under the age of 20."
        ja="20歳未満の者の飲酒は法律で禁止されています。20歳未満の者には酒類を販売いたしません。"
      />,
      <L
        key="b2"
        en="Sake is an alcoholic beverage. You must be of legal drinking age in your country to view product detail pages or place an order, and we may verify age at delivery."
        ja="日本国内のお客様は満20歳以上であること、海外のお客様は居住国・地域における法定飲酒年齢以上であることをご確認のうえ、ご注文・閲覧をお願いいたします。当社は配送時に年齢確認を行う場合があります。"
      />,
      <L
        key="b3"
        en="We currently ship only to addresses where the import of alcoholic beverages is permitted. Where local law restricts the sale, the order will be cancelled and refunded."
        ja="酒類の輸入が認められている住所にのみ配送しています。現地の法令により販売が制限される場合、ご注文はキャンセルのうえ全額返金いたします。"
      />,
    ],
  },
  {
    num: "03",
    heading: <L en="Product & vintage" ja="商品について" />,
    body: [
      <L
        key="b"
        en="Sake is an agricultural product. Subtle variations between batches and vintages are part of its character. We make every reasonable effort to describe the product accurately, but minor differences in colour, aroma, or label may occur."
        ja="日本酒は農産物です。仕込みや年度によるわずかな違いも、その個性のひとつです。商品の説明には最善を尽くしていますが、色・香り・ラベルに細かな差異が生じることがあります。"
      />,
    ],
  },
  {
    num: "04",
    heading: <L en="Pricing & payment" ja="価格・お支払い" />,
    body: [
      <L
        key="b"
        en="All prices are shown in JPY with consumption tax included, unless otherwise stated, and may be adjusted to reflect duties or shipping. Shipping and cash-on-delivery fees are borne by the customer; see the Tokutei Shōtorihiki notice for full sale conditions. We reserve the right to correct pricing errors and cancel affected orders, refunding any charges in full."
        ja="商品ページに表示している販売価格はすべて日本円・消費税10%込みの税込価格です。送料・代引手数料等は別途お客様のご負担となります。詳しい販売条件は「特定商取引法に基づく表示」をご確認ください。価格の誤りがあった場合、当社は訂正のうえ該当注文をキャンセルし、お支払い済みの料金は全額返金いたします。"
      />,
    ],
  },
  {
    num: "05",
    heading: <L en="Intellectual property" ja="知的財産" />,
    body: [
      <L
        key="b"
        en="All photography, copy, illustrations, and brand marks on this site are the property of FUJISAN SAKE or used under licence. They may not be reproduced commercially without written permission."
        ja="本サイトのすべての写真・文章・イラスト・ブランド標章は、FUJISAN SAKE に帰属するか、許諾を得て使用しています。書面による許可なく商用で複製することを禁じます。"
      />,
    ],
  },
  {
    num: "06",
    heading: <L en="Limitation of liability" ja="責任の範囲" />,
    body: [
      <L
        key="b"
        en="To the extent permitted by law, FUJISAN SAKE is not liable for indirect, incidental, or consequential damages arising from the use of this site or our products. Nothing in these terms excludes liability that cannot be excluded by applicable law."
        ja="法律で認められる範囲において、FUJISAN SAKE は本サイトまたは当社製品の利用から生じる間接的・付随的・結果的損害について責任を負いません。適用法令上排除できない責任を排除するものではありません。"
      />,
    ],
  },
  {
    num: "07",
    heading: <L en="Governing law" ja="準拠法" />,
    body: [
      <L
        key="b"
        en="These terms are governed by the laws of Japan. Any dispute arising from them will be resolved in the courts of Tokyo, unless local consumer law requires otherwise."
        ja="本規約は日本法に準拠します。本規約から生じる紛争は、現地の消費者法に別段の定めがある場合を除き、東京の裁判所を専属的合意管轄裁判所として解決するものとします。"
      />,
    ],
  },
];

export default function TermsPage() {
  return (
    <FujisanInfoPage
      eyebrow="LEGAL · TERMS"
      chapter="Ⅴ"
      title="TERMS OF USE"
      jp="― 利用規約 ―"
      lead={
        <L
          en="These terms set out how we work together — what you can expect from us, and what we expect from you, when you visit our site or buy our sake."
          ja="本規約は、当サイトのご利用や当社の酒のご購入にあたり、私たちと皆さまの双方が大切にする約束を定めるものです。"
        />
      }
      crumb={{ label: "TERMS", href: "/terms" }}
      updated="2026.04"
      sections={sections}
    />
  );
}
