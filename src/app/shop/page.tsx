import Image from "next/image";
import Link from "next/link";
import { EditorialPage } from "@/components/fujisan/editorial/EditorialPage";
import { EditorialPageHeader } from "@/components/fujisan/editorial/EditorialPageHeader";
import { EditorialSection } from "@/components/fujisan/editorial/EditorialSection";
import { EdDataList } from "@/components/fujisan/editorial/ui";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { SHIPPING_FEE } from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Purchase",
  description:
    "Two paths to the bottle. Order a single bottle for your table, or open a wholesale account for your restaurant, bar, or retail programme.",
  path: "/shop",
});

const routes = [
  {
    href: "/shop/personal",
    image: "/images/personal.webp",
    imagePos: "object-[55%_50%]",
    heading: { en: "For your table", ja: "ご家庭へ、贈り物へ" },
    lead: {
      en: "Any of the five Bushido bottles, one at a time — for your table or as a gift. From ¥1,600.",
      ja: "武士道シリーズ5銘柄を、一本からご購入いただけます。ご自宅用にも、贈り物にも。1,600円より。",
    },
    facts: [
      {
        label: { en: "Sizes", ja: "容量" },
        value: { en: "300 ml & 180 ml, from ¥1,600", ja: "300ml・180ml ／ 1,600円より" },
      },
      {
        label: { en: "Shipping", ja: "送料" },
        value: { en: SHIPPING_FEE.flatEn, ja: SHIPPING_FEE.flat },
      },
      {
        label: { en: "Dispatch", ja: "発送" },
        value: {
          en: "Within two business days",
          ja: "ご注文確認後、原則2営業日以内",
        },
      },
    ],
    cta: { en: "Browse the collection", ja: "コレクションを見る" },
  },
  {
    href: "/shop/business",
    image: "/images/restaurant.webp",
    imagePos: "object-[50%_46%]",
    heading: { en: "For your programme", ja: "飲食店・小売店さまへ" },
    lead: {
      en: "For restaurants, bars, retailers, and hospitality programmes. Account pricing, case quantities, and one named contact.",
      ja: "レストラン・バー・小売店・ホテルのみなさまへ。卸価格、ケース単位でのお届け、専任担当によるサポートをご用意します。",
    },
    facts: [
      {
        label: { en: "Unit", ja: "単位" },
        value: { en: "Case pricing (6 / 12 bottles)", ja: "ケース単位（6本／12本）" },
      },
      {
        label: { en: "Support", ja: "支援" },
        value: {
          en: "Listing and staff training",
          ja: "メニューづくり・スタッフ研修",
        },
      },
      {
        label: { en: "Quote", ja: "お見積り" },
        value: {
          en: "Within two business days, JPY",
          ja: "2営業日以内・円建て",
        },
      },
    ],
    cta: { en: "Open a trade account", ja: "卸・取扱のご相談へ" },
  },
];

const assurances = [
  {
    label: { en: "Hand-checked", ja: "検品" },
    value: {
      en: "Every order is checked by hand at the kura before it ships, and packed in a chilled outer box.",
      ja: "すべてのご注文を、出荷前に蔵でひとつずつ検品し、保冷外箱に詰めてお送りします。",
    },
  },
  {
    label: { en: "Prices", ja: "価格" },
    value: {
      en: "All prices include tax. Sale conditions are documented in the Tokutei Shōtorihiki notice.",
      ja: "価格はすべて税込で表示しています。販売条件は特定商取引法に基づく表示に明記しています。",
    },
  },
  {
    label: { en: "Age 20+", ja: "年齢確認" },
    value: {
      en: "Age is verified at order and again at the door. We do not sell to anyone under 20.",
      ja: "ご注文時と配送時に年齢を確認します。20歳未満の方へは販売いたしません。",
    },
  },
];

export default function ShopHubPage() {
  return (
    <EditorialPage>
      <EditorialPageHeader
        width="wide"
        kicker={<L en="Purchase" ja="ご購入" />}
        title={<L en="How to order" ja="お求めについて" />}
        lead={
          <L
            en="Personal orders and trade orders go through separate routes. Choose the one that fits."
            ja="個人のお客様と、飲食店・小売店などの法人のお客様とで、ご購入の窓口が分かれています。"
          />
        }
      />

      {routes.map((r, i) => (
        <EditorialSection key={r.href} width="wide" ruled={i > 0}>
          <div
            className={`grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-20 ${
              i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <Reveal className="relative aspect-[4/3] w-full overflow-hidden lg:aspect-[5/4]">
              <Image
                src={r.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className={`fujisan-grade object-cover ${r.imagePos}`}
              />
            </Reveal>

            <div>
              <Reveal as="p" className="ed-num">
                {String(i + 1).padStart(2, "0")}
              </Reveal>

              <Reveal as="h2" className="ed-h2 mt-3" delay={revealDelays.d1}>
                <L en={r.heading.en} ja={r.heading.ja} />
              </Reveal>

              <Reveal as="p" className="ed-p mt-5" delay={revealDelays.d1}>
                <L en={r.lead.en} ja={r.lead.ja} />
              </Reveal>

              <Reveal delay={revealDelays.d2}>
                <EdDataList
                  className="mt-9"
                  rows={r.facts.map((f) => ({
                    label: <L en={f.label.en} ja={f.label.ja} />,
                    value: <L en={f.value.en} ja={f.value.ja} />,
                  }))}
                />
              </Reveal>

              <Reveal delay={revealDelays.d3} className="mt-10">
                <Link href={r.href} className="ed-btn">
                  <L en={r.cta.en} ja={r.cta.ja} />
                </Link>
              </Reveal>
            </div>
          </div>
        </EditorialSection>
      ))}

      <EditorialSection>
        <h2 className="ed-h2">
          <L
            en="The same care, whichever route you take."
            ja="どちらの窓口でも、扱いは変わりません。"
          />
        </h2>

        <EdDataList
          className="mt-10"
          rows={assurances.map((a) => ({
            label: <L en={a.label.en} ja={a.label.ja} />,
            value: <L en={a.value.en} ja={a.value.ja} />,
          }))}
        />

        <p className="ed-small mt-10">
          <L
            en={
              <>
                Sale conditions are listed in the{" "}
                <Link href="/tokushoho" className="ed-link">
                  Tokutei Shōtorihiki notice
                </Link>
                , and delivery terms on the{" "}
                <Link href="/shipping" className="ed-link">
                  shipping page
                </Link>
                .
              </>
            }
            ja={
              <>
                販売条件は
                <Link href="/tokushoho" className="ed-link">
                  特定商取引法に基づく表示
                </Link>
                、配送条件は
                <Link href="/shipping" className="ed-link">
                  お届けと返品
                </Link>
                に記しています。
              </>
            }
          />
        </p>
      </EditorialSection>
    </EditorialPage>
  );
}
