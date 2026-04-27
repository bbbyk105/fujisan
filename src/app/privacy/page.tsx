import FujisanInfoPage, {
  type InfoSection,
} from "@/components/fujisan/FujisanInfoPage";

export const metadata = {
  title: "Privacy Policy — FUJISAN SAKE",
  description:
    "How FUJISAN SAKE collects, uses, and protects your personal information.",
};

const sections: InfoSection[] = [
  {
    num: "01",
    heading: "Information we collect",
    jp: "取得する情報",
    body: [
      "When you visit fujisan-sake.com or place an order, we collect a small set of information that lets us deliver our products and improve our service. This includes your name, shipping address, email, telephone number, and order history.",
      "We may also collect anonymous analytics — pages visited, device type, and approximate region — to understand how the site is used. These do not identify you personally.",
    ],
  },
  {
    num: "02",
    heading: "How we use your information",
    jp: "利用目的",
    body: [
      "Your information is used to fulfill orders, respond to enquiries, send transactional emails, and — when you opt in — share occasional news from the brewhouse.",
    ],
    bullets: [
      "Processing and shipping orders",
      "Customer support and order updates",
      "Age verification at the point of sale",
      "Optional newsletter, sent only with your consent",
    ],
  },
  {
    num: "03",
    heading: "Sharing & third parties",
    jp: "第三者提供",
    body: [
      "We do not sell or rent personal data. We share information only with service providers required to operate the store — payment processors, shipping carriers, and email infrastructure — and only to the extent necessary.",
      "Where required by law, we may disclose information in response to a lawful request from a public authority.",
    ],
  },
  {
    num: "04",
    heading: "Cookies & analytics",
    jp: "クッキー",
    body: [
      "We use a minimal set of cookies to remember your cart and preferences, and to gather aggregated analytics. You can control cookies in your browser settings; disabling them may affect site functionality.",
    ],
  },
  {
    num: "05",
    heading: "Your rights",
    jp: "お客様の権利",
    body: [
      "You may request a copy of the personal data we hold about you, ask us to correct inaccuracies, or request deletion. Contact us at privacy@fujisan-sake.com and we will respond within thirty days.",
    ],
  },
  {
    num: "06",
    heading: "Changes to this policy",
    jp: "改訂",
    body: [
      "We may update this policy as our services evolve. Material changes will be announced on this page. The date below indicates the most recent revision.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <FujisanInfoPage
      eyebrow="LEGAL · PRIVACY"
      chapter="Ⅳ"
      title="PRIVACY POLICY"
      jp="― プライバシーポリシー ―"
      lead="We collect only what we need, treat it with care, and keep it for no longer than necessary. This page explains how."
      crumb={{ label: "PRIVACY", href: "/privacy" }}
      updated="2026.04"
      sections={sections}
    />
  );
}
