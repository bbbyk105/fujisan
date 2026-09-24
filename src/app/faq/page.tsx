import { EditorialPage } from "@/components/fujisan/editorial/EditorialPage";
import { EditorialPageHeader } from "@/components/fujisan/editorial/EditorialPageHeader";
import {
  EditorialSection,
  EditorialSectionHead,
} from "@/components/fujisan/editorial/EditorialSection";
import { EdFaq } from "@/components/fujisan/editorial/ui";
import { FUJISAN_LEGAL, SHIPPING_FEE } from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "FAQ",
  description:
    "Answers to common questions about Fujisan sake — storing, serving, ordering, and gifting.",
  path: "/faq",
});

/**
 * 問いは「読み手が困る順」に束ねる。
 * 8 つを平らに並べると、探している一問が見つからない。
 */
const groups = [
  {
    heading: <L en="Choosing and serving" ja="選び方と飲み方" />,
    items: [
      {
        q: (
          <L
            en="What is the right serving temperature?"
            ja="飲み頃の温度は？"
          />
        ),
        a: (
          <L
            en="Each bottle carries a recommended temperature on its product page. As a starting point: aroma-driven daiginjo around 8°C, junmai chilled or lightly warmed to about 40°C. Several labels are good both ways."
            ja="おすすめの温度は各商品ページに記しています。目安は、香りの高い大吟醸で8℃前後、純米は冷やすか40℃前後のぬる燗で。冷やでも燗でも楽しめる銘柄もあります。"
          />
        ),
      },
      {
        q: <L en="Which bottle should I start with?" ja="最初の一本は？" />,
        a: (
          <L
            en="If sake is new to you, start with a junmai: full-bodied and approachable. A junmai ginjo is more floral, and a junmai daiginjo more fruity and aromatic."
            ja="日本酒がはじめての方には、ふくらみがあって飲みやすい純米がおすすめです。純米吟醸は花のような香り、純米大吟醸は果実のような香りがより強くなります。"
          />
        ),
      },
      {
        q: (
          <L
            en="How should I store an unopened bottle?"
            ja="未開封のまま保管するには？"
          />
        ),
        a: (
          <L
            en="Upright, in the dark, between 5°C and 12°C — a wine fridge is ideal. Sake is sensitive to UV and heat, so keep it out of direct sunlight and away from sudden temperature swings."
            ja="直射日光を避け、5〜12℃の暗所で立てて保管してください。ワインセラーが理想です。紫外線と熱に弱いため、急な温度変化も避けてください。"
          />
        ),
      },
      {
        q: <L en="How long does it keep once opened?" ja="開栓後の日持ちは？" />,
        a: (
          <L
            en="Keep it in the fridge. Daiginjo and ginjo are best within seven to ten days, fuller junmai styles within about two weeks. It will not spoil quickly, but the flavour is freshest in the first week."
            ja="冷蔵庫で保管し、大吟醸・吟醸は7〜10日、コクのある純米は2週間ほどを目安にお飲みください。すぐに悪くなるわけではありませんが、香りと味は最初の1週間がもっとも新鮮です。"
          />
        ),
      },
    ],
  },
  {
    heading: <L en="Before you order" ja="ご注文の前に" />,
    items: [
      {
        q: <L en="Can I send a bottle as a gift?" ja="ギフトとして贈れますか？" />,
        a: (
          <L
            en="Every bottle ships in a presentation box wrapped in washi, so it arrives ready to give. Noshi wrapping and message cards are not yet available at checkout — write to us before ordering and we will do what we can."
            ja="各ボトルは和紙で包んだ化粧箱でお届けしますので、そのまま贈り物にお使いいただけます。のし紙やメッセージカードは、現在ご購入手続きの中では承っておりません。ご注文前にご連絡いただければ、できる限り対応いたします。"
          />
        ),
      },
      {
        q: (
          <L
            en="Where do you ship, and how much is postage?"
            ja="配送地域と送料は？"
          />
        ),
        a: (
          <L
            en={
              <>
                Within Japan only. {SHIPPING_FEE.flatEn}. {SHIPPING_FEE.freeEn}.
                Full details are on the{" "}
                <a href="/shipping" className="ed-link">
                  shipping page
                </a>
                .
              </>
            }
            ja={
              <>
                お届けは日本国内のみです。送料は{SHIPPING_FEE.flat}、
                {SHIPPING_FEE.free}。詳しくは
                <a href="/shipping" className="ed-link">
                  お届けと返品
                </a>
                をご覧ください。
              </>
            }
          />
        ),
      },
    ],
  },
  {
    heading: <L en="Visits and trade" ja="蔵見学とお取引" />,
    items: [
      {
        q: <L en="Can I visit the brewery?" ja="蔵見学はできますか？" />,
        a: (
          <L
            en="Small-group visits to Makino Shuzo, the kura that brews the Bushido series, can be arranged by appointment. Visits run from November through March, while the brewhouse is at work."
            ja="武士道シリーズを醸す牧野酒造合資会社の蔵見学を、ご予約制・少人数で承っています。仕込みの行われる11月から3月までの実施です。"
          />
        ),
      },
      {
        q: (
          <L
            en="I work in the trade — can we talk wholesale?"
            ja="業務用・卸の相談はできますか？"
          />
        ),
        a: (
          <L
            en={
              <>
                We work with a small, considered list of restaurants and
                retailers. Tell us about your venue from the{" "}
                <a href="/shop/business" className="ed-link">
                  trade page
                </a>
                .
              </>
            }
            ja={
              <>
                限られた数の飲食店・小売店さまとお取引しています。
                <a href="/shop/business" className="ed-link">
                  取扱・卸のご案内
                </a>
                から、お店のことをお聞かせください。
              </>
            }
          />
        ),
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <EditorialPage>
      <EditorialPageHeader
        kicker={<L en="Guidance" ja="ご案内" />}
        title={<L en="Frequently asked" ja="よくあるご質問" />}
        lead={
          <L
            en="Common questions about storing, serving, and ordering our sake."
            ja="保管や飲み方、ご注文について、よくいただくご質問をまとめています。"
          />
        }
        meta={<L en="Last updated 2026.09" ja="最終更新 2026.09" />}
      />

      {groups.map((g, i) => (
        <EditorialSection key={i} ruled={i > 0} className="py-14 md:py-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,230px)_minmax(0,1fr)] md:gap-16">
            <EditorialSectionHead
              heading={g.heading}
              className="md:sticky md:top-[112px] md:self-start"
            />
            <EdFaq items={g.items} />
          </div>
        </EditorialSection>
      ))}

      {/* 問答で解けないときの行き先。FAQ の 1 項目にすると見落とされる */}
      <EditorialSection>
        <p className="ed-h2">
          <L
            en="If your question isn't answered here, contact us."
            ja="ここで解決しないときは、お問い合わせください。"
          />
        </p>
        <p className="ed-p mt-5">
          <L
            en="We reply within two business days, in Japanese or English."
            ja="日本語・英語のどちらでも、通常2営業日以内にご返信します。"
          />
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-10 gap-y-4">
          <a href="/contact" className="ed-btn">
            <L en="Contact form" ja="お問い合わせフォーム" />
          </a>
          <a
            href={`mailto:${FUJISAN_LEGAL.email}`}
            className="ed-link text-[13.5px]"
          >
            {FUJISAN_LEGAL.email}
          </a>
        </div>
      </EditorialSection>
    </EditorialPage>
  );
}
