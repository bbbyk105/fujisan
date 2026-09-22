import FujisanInfoPage, {
  type InfoSection,
} from "@/components/fujisan/FujisanInfoPage";
import { FUJISAN_LEGAL } from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "How FUJISAN SAKE collects, uses, and protects your personal information.",
  path: "/privacy",
});

/**
 * 個人情報保護法で公表が求められる項目（事業者の氏名・住所・代表者名、利用目的、
 * 安全管理措置、開示等の請求手続き、苦情の申出先）を漏らさず載せること。
 * 記載内容は実装と一致させる — 実装していない機能（メールマガジン配信や
 * アクセス解析など）を書いてはならない。
 */
const sections: InfoSection[] = [
  {
    num: "01",
    heading: <L en="Who handles your data" ja="個人情報取扱事業者" />,
    body: [
      <L
        key="b1"
        en="The business responsible for handling personal information collected through this site is:"
        ja="当サイトで取得した個人情報を取り扱う事業者は、以下のとおりです。"
      />,
    ],
    bullets: [
      <L
        key="1"
        en={`Business — ${FUJISAN_LEGAL.sellerName}`}
        ja={`事業者名: ${FUJISAN_LEGAL.sellerName}`}
      />,
      <L
        key="2"
        en={`Representative — ${FUJISAN_LEGAL.representative}`}
        ja={`代表者: ${FUJISAN_LEGAL.representative}`}
      />,
      <L
        key="3"
        en={`Address — ${FUJISAN_LEGAL.addressEn}`}
        ja={`所在地: ${FUJISAN_LEGAL.address}`}
      />,
      <L
        key="4"
        en={`Contact — ${FUJISAN_LEGAL.email} / ${FUJISAN_LEGAL.phone}`}
        ja={`連絡先: ${FUJISAN_LEGAL.email} ／ ${FUJISAN_LEGAL.phone}`}
      />,
    ],
  },
  {
    num: "02",
    heading: <L en="Information we collect" ja="取得する情報" />,
    body: [
      <L
        key="b1"
        en="When you create an account, place an order, or send us an enquiry, we collect only what we need to serve you. We do not use advertising trackers or third-party analytics, and we do not build profiles of your browsing."
        ja="アカウント登録・ご注文・お問い合わせの際に、対応に必要な情報のみを取得します。広告トラッカーや第三者のアクセス解析は使用しておらず、閲覧行動のプロファイリングも行いません。"
      />,
    ],
    bullets: [
      <L
        key="1"
        en="Account — name (or company name and contact person), email address, telephone number, postal code and address"
        ja="アカウント情報: お名前（法人の場合は会社名・ご担当者名）、メールアドレス、電話番号、郵便番号、住所"
      />,
      <L
        key="2"
        en="Orders — items ordered, amounts, delivery address, telephone number, and delivery status"
        ja="ご注文情報: ご注文商品、金額、お届け先住所、電話番号、配送状況"
      />,
      <L
        key="3"
        en="Enquiries — name, email address, subject and message you send us"
        ja="お問い合わせ情報: お名前、メールアドレス、ご用件、本文"
      />,
      <L
        key="3b"
        en="Enquiries store a one-way hash of your IP address — never the address itself — used only to block repeated automated submissions."
        ja="お問い合わせの際、連投による自動送信を防ぐ目的でのみ、IP アドレスを復元できない形に変換した値を保存します（IP アドレスそのものは保存しません）。"
      />,
      <L
        key="3c"
        en="Sign-in and account pages count recent attempts per IP address to block password guessing and mass email sending. These counters hold the address for at most one hour and are then deleted."
        ja="ログイン・アカウント関連のページでは、パスワードの総当たりやメールの大量送信を防ぐため、IP アドレスごとの試行回数を数えます。この記録は最長でも 1 時間で削除します。"
      />,
      <L
        key="4"
        en="Card details are entered on Stripe's payment page and are never sent to or stored on our servers"
        ja="クレジットカード情報は Stripe の決済ページで入力され、当社サーバーには送信も保存もされません"
      />,
    ],
  },
  {
    num: "03",
    heading: <L en="How we use your information" ja="利用目的" />,
    body: [
      <L
        key="b"
        en="We use your information only for the purposes below. We will not use it for any other purpose without asking you first."
        ja="取得した情報は、以下の目的にのみ利用します。これ以外の目的で利用する場合は、あらためてご本人の同意をいただきます。"
      />,
    ],
    bullets: [
      <L key="1" en="Processing and shipping orders" ja="ご注文の処理・発送" />,
      <L
        key="2"
        en="Customer support, order updates, and replies to enquiries"
        ja="お問い合わせ対応・注文状況のご連絡"
      />,
      <L
        key="3"
        en="Age verification at the point of sale, as required by law"
        ja="法令に基づく販売時の年齢確認"
      />,
      <L
        key="4"
        en="Account authentication and email verification"
        ja="アカウントの認証・メールアドレスの確認"
      />,
      <L
        key="5"
        en="Keeping the transaction records we are required by law to retain"
        ja="法令上保存が義務づけられた取引記録の保管"
      />,
    ],
  },
  {
    num: "04",
    heading: <L en="Sharing & third parties" ja="第三者提供・委託先" />,
    body: [
      <L
        key="b1"
        en="We do not sell or rent personal data. We entrust it only to the service providers needed to run the store, and only to the extent necessary."
        ja="個人データの販売・貸与は行いません。店舗の運営に必要なサービス提供者に対し、必要な範囲でのみ取り扱いを委託します。"
      />,
      <L
        key="b2"
        en="Some of these providers operate servers outside Japan, so your data may be transferred abroad in the course of providing the service."
        ja="これらの委託先の一部は日本国外にサーバーを設置しているため、サービス提供の過程で個人データが国外に移転される場合があります。"
      />,
      <L
        key="b3"
        en="Where required by law, we may disclose information in response to a lawful request from a public authority."
        ja="法令で求められる場合、公的機関からの適法な要請に応じて情報を開示することがあります。"
      />,
    ],
    bullets: [
      <L
        key="1"
        en="Stripe — payment processing (card details are handled by Stripe, not by us)"
        ja="Stripe: 決済処理（カード情報は当社ではなく Stripe が取り扱います）"
      />,
      <L
        key="2"
        en="Cloudflare — site hosting and database"
        ja="Cloudflare: サイトのホスティング・データベース"
      />,
      <L key="3" en="Resend — transactional email" ja="Resend: メールの配信" />,
      <L
        key="4"
        en="Delivery carriers — name, address and telephone number needed to deliver your order"
        ja="配送業者: お届けに必要なお名前・ご住所・電話番号"
      />,
    ],
  },
  {
    num: "05",
    heading: <L en="Cookies & local storage" ja="クッキー・ローカルストレージ" />,
    body: [
      <L
        key="b"
        en="We use no advertising or analytics cookies. The only cookie we set is the one that keeps you signed in. Your cart, language choice and age confirmation are kept in your browser's local storage and are never sent to us."
        ja="広告・アクセス解析のためのクッキーは使用していません。当社が設定するクッキーは、ログイン状態を保持するためのものだけです。カートの中身・表示言語・年齢確認の記録は、お使いのブラウザのローカルストレージに保存され、当社へ送信されることはありません。"
      />,
    ],
    bullets: [
      <L
        key="1"
        en="Session cookie — keeps you signed in to your account"
        ja="セッションクッキー: ログイン状態の保持"
      />,
      <L
        key="2"
        en="Local storage — cart contents, language preference, age confirmation"
        ja="ローカルストレージ: カートの中身、表示言語、年齢確認の記録"
      />,
      <L
        key="3"
        en="You can clear these from your browser settings; doing so will sign you out and empty your cart"
        ja="いずれもブラウザの設定から削除できます。削除するとログアウトし、カートは空になります"
      />,
    ],
  },
  {
    num: "06",
    heading: <L en="How long we keep it" ja="保有期間" />,
    body: [
      <L
        key="b"
        en="Account information is kept while your account is open. You can close your account yourself from the account page once any order in progress has been delivered. Order records are kept for the period required by tax and commercial law even after an account is closed, and enquiry records are kept for up to three years."
        ja="アカウント情報は、アカウントをご利用の間、保有します。進行中のご注文がお届け済みになれば、アカウントページからご自身で退会いただけます。ご注文の記録は、退会後も税法・商法上必要な期間保存します。お問い合わせの記録は最長3年間保存します。"
      />,
    ],
  },
  {
    num: "07",
    heading: <L en="Security measures" ja="安全管理措置" />,
    body: [
      <L
        key="b"
        en="We take the following measures to keep your information safe."
        ja="取得した個人情報の安全管理のため、以下の措置を講じています。"
      />,
    ],
    bullets: [
      <L
        key="1"
        en="All communication with this site is encrypted with TLS"
        ja="当サイトとの通信はすべて TLS により暗号化しています"
      />,
      <L
        key="2"
        en="Card details never reach our servers — they are handled entirely by Stripe"
        ja="クレジットカード情報は当社サーバーを経由せず、すべて Stripe が取り扱います"
      />,
      <L
        key="3"
        en="Passwords are stored only as hashes, never in readable form"
        ja="パスワードはハッシュ化して保存し、読み取り可能な形では保持しません"
      />,
      <L
        key="4"
        en="Access to order and customer data is limited to authorised staff accounts"
        ja="ご注文・お客様情報へのアクセスは、権限を付与したスタッフのアカウントに限定しています"
      />,
    ],
  },
  {
    num: "08",
    heading: <L en="Your rights & complaints" ja="開示等のご請求・苦情の申出先" />,
    body: [
      <L
        key="b1"
        en="You may ask us to disclose, correct, add to, delete, or stop using the personal data we hold about you, or to stop providing it to third parties. Write to the address below and we will respond within thirty days after confirming your identity."
        ja="当社が保有するお客様の個人データについて、開示・訂正・追加・削除・利用停止・第三者提供の停止をご請求いただけます。下記の窓口までご連絡ください。ご本人であることを確認のうえ、30日以内にご対応いたします。"
      />,
      <L
        key="b2"
        en="Complaints about how we handle personal information are received at the same address."
        ja="個人情報の取扱いに関する苦情・ご相談も、同じ窓口で承ります。"
      />,
    ],
    bullets: [
      <L
        key="1"
        en={`Personal information desk — ${FUJISAN_LEGAL.ecManager}`}
        ja={`個人情報お問い合わせ窓口: ${FUJISAN_LEGAL.ecManager}`}
      />,
      <L
        key="2"
        en={`Email — ${FUJISAN_LEGAL.email}`}
        ja={`メール: ${FUJISAN_LEGAL.email}`}
      />,
      <L
        key="3"
        en={`Telephone — ${FUJISAN_LEGAL.phone}（${FUJISAN_LEGAL.phoneHours}）`}
        ja={`電話: ${FUJISAN_LEGAL.phone}（${FUJISAN_LEGAL.phoneHours}）`}
      />,
    ],
  },
  {
    num: "09",
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
      updated="2026.09"
      sections={sections}
    />
  );
}
