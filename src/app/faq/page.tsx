import FujisanInfoPage, {
  type InfoSection,
} from "@/components/fujisan/FujisanInfoPage";

export const metadata = {
  title: "FAQ — FUJISAN SAKE",
  description:
    "Answers to common questions about Fujisan sake — storing, serving, ordering, and gifting.",
};

const sections: InfoSection[] = [
  {
    num: "01",
    heading: "How should I store an unopened bottle?",
    jp: "未開封の保管",
    body: [
      "Keep the bottle upright in a dark place between 5°C and 12°C. A wine fridge is ideal. Avoid direct sunlight and sudden temperature shifts — sake is sensitive to UV and heat.",
    ],
  },
  {
    num: "02",
    heading: "How long does sake keep once opened?",
    jp: "開栓後の目安",
    body: [
      "Once opened, store the bottle in the refrigerator and enjoy within seven to ten days for daiginjo and ginjo, and within two weeks for honjozo and junmai. The sake will not spoil quickly, but its freshness is at its peak in the first week.",
    ],
  },
  {
    num: "03",
    heading: "What is the right serving temperature?",
    jp: "適温",
    body: [
      "Each bottle in the collection has a recommended temperature on its product page. As a starting point: aroma-driven daiginjo around 8°C, junmai chilled or lightly warmed around 40°C, honjozo enjoyable both chilled and warm.",
    ],
  },
  {
    num: "04",
    heading: "Which sake should I choose first?",
    jp: "はじめての一本",
    body: [
      "If you are new to sake, the Tokubetsu Junmai is a generous, approachable starting point. From there, the Junmai Ginjo opens up the floral side of the spectrum, and the Junmai Daiginjo Aroma brings the perfume of the orchard.",
    ],
  },
  {
    num: "05",
    heading: "Can I gift Fujisan sake?",
    jp: "ギフトについて",
    body: [
      "Yes. Each bottle ships in a presentation box wrapped in washi paper. At checkout you can add a handwritten note and request that the invoice be sent to a separate billing address.",
    ],
  },
  {
    num: "06",
    heading: "Do you offer brewery visits?",
    jp: "蔵見学",
    body: [
      "We welcome small groups by appointment. Visits run from November through March, when the brewhouse is at work. Please write to visit@fujisan-sake.com to enquire.",
    ],
  },
  {
    num: "07",
    heading: "I work in the trade — can we discuss wholesale?",
    jp: "業務用・卸",
    body: [
      "We work with a small, considered list of restaurants and retailers. If our sake fits your programme, please contact trade@fujisan-sake.com with a brief introduction to your venue.",
    ],
  },
  {
    num: "08",
    heading: "How do I reach a real person?",
    jp: "お問い合わせ",
    body: [
      "Email care@fujisan-sake.com. Our small team is in Shizuoka and replies in Japanese or English, usually within one business day.",
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
      lead="A short field guide for storing, serving, and ordering Fujisan sake. If your question is not here, write to us — we read every email."
      crumb={{ label: "FAQ", href: "/faq" }}
      updated="2026.04"
      sections={sections}
    />
  );
}
