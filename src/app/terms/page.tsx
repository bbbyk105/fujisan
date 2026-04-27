import FujisanInfoPage, {
  type InfoSection,
} from "@/components/fujisan/FujisanInfoPage";

export const metadata = {
  title: "Terms of Use — FUJISAN SAKE",
  description:
    "The terms governing your use of fujisan-sake.com and the purchase of FUJISAN SAKE products.",
};

const sections: InfoSection[] = [
  {
    num: "01",
    heading: "Acceptance",
    jp: "ご同意",
    body: [
      "By accessing fujisan-sake.com or placing an order, you agree to these Terms of Use. If you do not agree, please do not use the site.",
    ],
  },
  {
    num: "02",
    heading: "Age & jurisdiction",
    jp: "年齢・販売地域",
    body: [
      "Sake is an alcoholic beverage. You must be of legal drinking age in your country to view product detail pages or place an order. We may verify age at delivery.",
      "We currently ship to addresses where the import of alcoholic beverages is permitted. Where local law restricts sale, the order will be cancelled and refunded.",
    ],
  },
  {
    num: "03",
    heading: "Product & vintage",
    jp: "商品について",
    body: [
      "Sake is an agricultural product. Subtle variations between batches and vintages are part of its character. We make every reasonable effort to describe the product accurately, but minor differences in colour, aroma, or label may occur.",
    ],
  },
  {
    num: "04",
    heading: "Pricing & payment",
    jp: "価格・お支払い",
    body: [
      "All prices are shown in JPY unless otherwise stated and may be adjusted to reflect taxes, duties, or shipping. We reserve the right to correct pricing errors and cancel orders affected by them, in which case we will refund any charges in full.",
    ],
  },
  {
    num: "05",
    heading: "Intellectual property",
    jp: "知的財産",
    body: [
      "All photography, copy, illustrations, and brand marks on this site are the property of FUJISAN SAKE or used under licence. They may not be reproduced commercially without written permission.",
    ],
  },
  {
    num: "06",
    heading: "Limitation of liability",
    jp: "責任の範囲",
    body: [
      "To the extent permitted by law, FUJISAN SAKE is not liable for indirect, incidental, or consequential damages arising from the use of this site or our products. Nothing in these terms excludes liability that cannot be excluded by applicable law.",
    ],
  },
  {
    num: "07",
    heading: "Governing law",
    jp: "準拠法",
    body: [
      "These terms are governed by the laws of Japan. Any dispute arising from them will be resolved in the courts of Tokyo, unless local consumer law requires otherwise.",
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
      lead="These terms set out how we work together — what you can expect from us, and what we expect from you, when you visit our site or buy our sake."
      crumb={{ label: "TERMS", href: "/terms" }}
      updated="2026.04"
      sections={sections}
    />
  );
}
