import Image from "next/image";
import Link from "next/link";
import { EditorialPage } from "@/components/fujisan/editorial/EditorialPage";
import { EditorialPageHeader } from "@/components/fujisan/editorial/EditorialPageHeader";
import {
  EditorialSection,
  EditorialSectionHead,
} from "@/components/fujisan/editorial/EditorialSection";
import {
  EdDataList,
  EdFaq,
  EdSteps,
} from "@/components/fujisan/editorial/ui";
import { WholesalePriceList } from "@/components/fujisan/WholesalePriceList";
import { TradeAccessBand } from "@/components/fujisan/TradeAccessBand";
import { FUJISAN_LEGAL } from "@/data/fujisan-legal";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { L } from "@/i18n/Localized";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Wholesale & Trade",
  description:
    "Wholesale and trade enquiries for restaurants, bars, retailers, and hospitality programmes. Account pricing, training, and brewer support from Shizuoka.",
  path: "/shop/business",
});

/** 口座で受けられることは「4枚のカード」ではなく、条件表として読ませる */
const terms = [
  {
    label: <L en="Pricing" ja="卸価格" />,
    value: (
      <L
        en="Case pricing in 6- and 12-bottle units, with tiered terms beyond ten cases per month."
        ja="6本／12本のケース単位で卸価格をご用意しています。月10ケースを超える場合は、数量に応じた条件をご相談いただけます。"
      />
    ),
  },
  {
    label: <L en="Brewer support" ja="醸造元との連携" />,
    value: (
      <L
        en="Tasting notes, serving guides, and staff training at major rollouts, arranged with Makino Shuzo, the brewery that makes the Bushido series."
        ja="テイスティングノート、提供時の資料、本格導入時の店舗研修まで、醸造元の牧野酒造合資会社と連携してお手伝いします。"
      />
    ),
  },
  {
    label: <L en="Logistics" ja="配送・物流" />,
    value: (
      <L
        en="Cool-chain delivery across Japan; export by sea or air with our partner forwarder."
        ja="国内はクール便、海外へは提携する輸送会社を通じて、海上・航空輸送に対応します。"
      />
    ),
  },
  {
    label: <L en="Your contact" ja="担当窓口" />,
    value: (
      <L
        en="One named contact for orders, replenishment, and brewery visits, in Japanese or English."
        ja="ご注文から在庫の補充、蔵見学のご相談まで、専任の担当が日本語・英語でお応えします。"
      />
    ),
  },
];

const process = [
  {
    heading: <L en="Submit the enquiry" ja="お問い合わせ" />,
    body: (
      <L
        en="Tell us about your programme, volume, and target launch through the contact form. We respond within two business days."
        ja="お問い合わせフォームから、業態・想定される取扱量・導入のご希望時期をお知らせください。2営業日以内に担当よりご返信します。"
      />
    ),
  },
  {
    heading: <L en="Sample and quote" ja="サンプルとお見積り" />,
    body: (
      <L
        en="We share trade pricing and lead times and, where appropriate, sample bottles for your team to taste."
        ja="内容を伺ったうえで、卸価格と納期をご提示します。ご希望に応じてサンプルもお送りしますので、実際に味わってからご検討ください。"
      />
    ),
  },
  {
    heading: <L en="Open the account" ja="口座開設" />,
    body: (
      <L
        en="Once licence verification and payment terms are agreed, we open your trade account and arrange the first delivery."
        ja="酒類販売免許とお支払い条件を確認のうえ、お取引口座を開設します。開設後は、初回のご注文からすみやかに出荷いたします。"
      />
    ),
  },
  {
    heading: <L en="Listing and rollout" ja="メニューへの導入" />,
    body: (
      <L
        en="We help with menu listings, staff training, and point-of-sale materials after you start."
        ja="メニューへの掲載、スタッフ研修、販促物のご用意など、導入後もお手伝いします。"
      />
    ),
  },
];

const faqs = [
  {
    q: <L en="What is your minimum order quantity?" ja="最低発注ロットは？" />,
    a: (
      <L
        en="Domestic orders begin at one case (300 ml × 12 or 180 ml × 24 bottles). Export shipments start at 3,000 bottles, mixed SKUs allowed. Details can be discussed."
        ja="国内は1ケース（300ml × 12本／180ml × 24本）より承ります。輸出は1出荷3,000本（銘柄混載可）が最小ロットです。内容に応じてご相談ください。"
      />
    ),
  },
  {
    q: <L en="Do you ship internationally?" ja="海外への輸出は可能ですか？" />,
    a: (
      <L
        en="Yes. We ship to partners across Asia, Europe, and North America via our forwarder. Tell us your destination and we will confirm route, lead time, and documentation."
        ja="はい、承っております。提携する輸送会社を通じて、アジア・欧州・北米への出荷実績があります。お届け先の国・地域をお知らせいただければ、輸送ルート・納期・必要書類をご案内します。"
      />
    ),
  },
  {
    q: (
      <L
        en="Can you provide private-label or OEM bottles?"
        ja="PB ／ OEM の対応は？"
      />
    ),
    a: (
      <L
        en="In some cases. The brewery is small, so it depends on capacity. Tell us your concept and target volume."
        ja="ご相談のうえで承ります。蔵の生産量には限りがあるため、ご要望の内容と取扱量を伺ったうえで、可否をお伝えします。"
      />
    ),
  },
  {
    q: <L en="What payment terms do you offer?" ja="お支払い条件は？" />,
    a: (
      <L
        en="The first order is bank transfer in advance. From the second order onward, net 30 terms are available after a brief credit review."
        ja="初回は前払い（銀行振込）にてお願いしております。2回目以降は、簡単な与信のご確認のうえ、月末締め・翌月末払いもご利用いただけます。"
      />
    ),
  },
];

export default function ShopBusinessPage() {
  return (
    <EditorialPage>
      <EditorialPageHeader
        kicker={<L en="Purchase" ja="ご購入" />}
        title={<L en="Trade accounts" ja="法人・取扱店のお客様" />}
        lead={
          <L
            en="For restaurants, retailers, and hotels. Open a trade account to see wholesale pricing; orders are arranged after a quote."
            ja="飲食店・小売店・宿泊施設など、法人のお客様向けのご案内です。取扱口座を開設すると卸価格をご覧いただけます。ご注文はお見積りのうえで承ります。"
          />
        }
      />

      <TradeAccessBand />

      {/* ===== 取引条件 ===== */}
      <EditorialSection ruled={false}>
        <EditorialSectionHead
          heading={
            <L
              en="Trade terms"
              ja="お取引の条件"
            />
          }
        />
        <EdDataList className="mt-10" rows={terms} />
      </EditorialSection>

      {/* ===== 卸価格表 ===== */}
      <EditorialSection>
        <EditorialSectionHead
          heading={
            <L
              en="Wholesale prices by bottle"
              ja="銘柄ごとの卸価格"
            />
          }
        />
        <div className="mt-10">
          <WholesalePriceList />
        </div>
      </EditorialSection>

      {/* ===== 取引の流れ ===== */}
      <EditorialSection>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:gap-16">
          <EditorialSectionHead
            heading={
              <L
                en="Opening an account"
                ja="お取引開始までの流れ"
              />
            }
            className="md:sticky md:top-[112px] md:self-start"
          />
          <EdSteps steps={process} />
        </div>
      </EditorialSection>

      {/* ===== 相談する ===== */}
      <EditorialSection>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          <div>
            <EditorialSectionHead
              heading={
                <L
                  en="Trade enquiries"
                  ja="お取引のご相談"
                />
              }
              lead={
                <L
                  en="Share your venue, expected volume, and target launch through the contact form, or write to the trade desk directly. We reply within two business days, in Japanese or English."
                  ja="業態や想定される取扱量、開始のご希望時期を、お問い合わせフォームまたは取扱店窓口へお知らせください。2営業日以内に、日本語または英語でご返信します。"
                />
              }
            />

            <Reveal
              className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4"
              delay={revealDelays.d3}
            >
              <Link href="/contact" className="ed-btn">
                <L en="Contact form" ja="お問い合わせフォームへ" />
              </Link>
              <a
                href={`mailto:${FUJISAN_LEGAL.email}`}
                className="ed-link text-[13px]"
              >
                {FUJISAN_LEGAL.email}
              </a>
            </Reveal>
          </div>

          <Reveal
            className="relative aspect-[4/3] w-full self-start"
            delay={revealDelays.d2}
          >
            <Image
              src="/images/direct-to-cus.webp"
              alt=""
              fill
              sizes="(min-width: 1024px) 38vw, 100vw"
              className="fujisan-grade object-cover object-[50%_50%]"
            />
          </Reveal>
        </div>
      </EditorialSection>

      {/* ===== 取引のご質問 ===== */}
      <EditorialSection>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:gap-16">
          <EditorialSectionHead
            heading={
              <L en="Common trade questions" ja="よくいただくお取引のご質問" />
            }
            className="md:sticky md:top-[112px] md:self-start"
          />
          <EdFaq items={faqs} />
        </div>
      </EditorialSection>
    </EditorialPage>
  );
}
