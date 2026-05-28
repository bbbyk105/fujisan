import FujisanInfoPage, {
  type InfoSection,
} from "@/components/fujisan/FujisanInfoPage";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Privacy Policy — FUJISAN SAKE",
  description:
    "How FUJISAN SAKE collects, uses, and protects your personal information.",
};

const sections: InfoSection[] = [
  {
    num: "01",
    heading: <L en="Information we collect" ja="取得する情報" />,
    body: [
      <L
        key="b1"
        en="When you visit fujisan-sake.com or place an order, we collect a small set of information that lets us deliver our products and improve our service. This includes your name, shipping address, email, telephone number, and order history."
        ja="fujisan-sake.com のご利用やご注文の際に、商品のお届けとサービス向上に必要な範囲で情報を取得します。具体的には、お名前・お届け先住所・メールアドレス・電話番号・ご注文履歴です。"
      />,
      <L
        key="b2"
        en="We may also collect anonymous analytics — pages visited, device type, and approximate region — to understand how the site is used. These do not identify you personally."
        ja="また、サイトの利用状況を把握するため、閲覧ページ・デバイスの種類・おおよその地域といった匿名の分析情報を取得することがあります。これらで個人を特定することはありません。"
      />,
    ],
  },
  {
    num: "02",
    heading: <L en="How we use your information" ja="利用目的" />,
    body: [
      <L
        key="b"
        en="Your information is used to fulfill orders, respond to enquiries, send transactional emails, and — when you opt in — share occasional news from the brewhouse."
        ja="取得した情報は、ご注文の履行、お問い合わせへの対応、取引上のメール送信、そしてご希望いただいた場合に限り、蔵元からのお知らせの配信に利用します。"
      />,
    ],
    bullets: [
      <L key="1" en="Processing and shipping orders" ja="ご注文の処理・発送" />,
      <L
        key="2"
        en="Customer support and order updates"
        ja="お問い合わせ対応・注文状況のご連絡"
      />,
      <L
        key="3"
        en="Age verification at the point of sale"
        ja="販売時の年齢確認"
      />,
      <L
        key="4"
        en="Optional newsletter, sent only with your consent"
        ja="ニュースレター（ご同意いただいた場合のみ配信）"
      />,
    ],
  },
  {
    num: "03",
    heading: <L en="Sharing & third parties" ja="第三者提供" />,
    body: [
      <L
        key="b1"
        en="We do not sell or rent personal data. We share information only with service providers required to operate the store — payment processors, shipping carriers, and email infrastructure — and only to the extent necessary."
        ja="個人データの販売・貸与は行いません。情報の共有は、店舗運営に必要なサービス提供者（決済代行・配送業者・メール配信基盤）に限り、必要な範囲でのみ行います。"
      />,
      <L
        key="b2"
        en="Where required by law, we may disclose information in response to a lawful request from a public authority."
        ja="法令で求められる場合、公的機関からの適法な要請に応じて情報を開示することがあります。"
      />,
    ],
  },
  {
    num: "04",
    heading: <L en="Cookies & analytics" ja="クッキー・分析" />,
    body: [
      <L
        key="b"
        en="We use a minimal set of cookies to remember your cart and preferences, and to gather aggregated analytics. You can control cookies in your browser settings; disabling them may affect site functionality."
        ja="カートやお客様の設定を記憶し、集計分析を行うため、必要最小限のクッキーを使用します。クッキーはブラウザの設定で管理できますが、無効にするとサイトの一部機能に影響する場合があります。"
      />,
    ],
  },
  {
    num: "05",
    heading: <L en="Your rights" ja="お客様の権利" />,
    body: [
      <L
        key="b"
        en="You may request a copy of the personal data we hold about you, ask us to correct inaccuracies, or request deletion. Contact us at privacy@fujisan-sake.com and we will respond within thirty days."
        ja="当社が保有するお客様の個人データの開示・訂正・削除をご請求いただけます。privacy@fujisan-sake.com までご連絡ください。30日以内にご対応いたします。"
      />,
    ],
  },
  {
    num: "06",
    heading: <L en="Changes to this policy" ja="改訂について" />,
    body: [
      <L
        key="b"
        en="We may update this policy as our services evolve. Material changes will be announced on this page. The date below indicates the most recent revision."
        ja="サービスの変化に応じて、本ポリシーを更新することがあります。重要な変更は本ページでお知らせします。下記の日付は最終改訂日を示します。"
      />,
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
      lead={
        <L
          en="We collect only what we need, treat it with care, and keep it for no longer than necessary. This page explains how."
          ja="必要な情報だけを取得し、丁寧に取り扱い、必要な期間を超えて保持しません。その方法をこのページでご説明します。"
        />
      }
      crumb={{ label: "PRIVACY", href: "/privacy" }}
      updated="2026.04"
      sections={sections}
    />
  );
}
