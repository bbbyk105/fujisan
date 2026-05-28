import Image from "next/image";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { FujisanInnerHero } from "@/components/fujisan/FujisanInnerHero";
import { WholesaleInquiryForm } from "@/components/fujisan/WholesaleInquiryForm";
import { WholesalePriceList } from "@/components/fujisan/WholesalePriceList";
import { TradeAccessBand } from "@/components/fujisan/TradeAccessBand";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Wholesale & Trade — FUJISAN SAKE",
  description:
    "Wholesale and trade enquiries for restaurants, bars, retailers, and hospitality programmes. Account pricing, training, and brewer support from Shizuoka.",
};

const benefits = [
  {
    num: "Ⅰ",
    eyebrow: { en: "ACCOUNT PRICING", ja: "卸価格でのお取引" },
    en: "Case pricing in 6- and 12-bottle units, with tiered terms beyond ten cases per month.",
    ja: "6本／12本のケース単位での卸価格。月10ケースを超える場合は、数量に応じた条件をご相談いただけます。",
  },
  {
    num: "Ⅱ",
    eyebrow: { en: "BREWER SUPPORT", ja: "蔵元のサポート" },
    en: "Tasting notes, serving guides, and an on-site staff training session at major rollouts.",
    ja: "テイスティングノート、提供時の資料、本格導入時の店舗研修まで、蔵元がお手伝いします。",
  },
  {
    num: "Ⅲ",
    eyebrow: { en: "LOGISTICS", ja: "配送・物流" },
    en: "Cool-chain delivery across Japan; export by sea or air with our partner forwarder.",
    ja: "国内はクール便、海外へは提携する輸送会社を通じて、海上・航空輸送に対応します。",
  },
  {
    num: "Ⅳ",
    eyebrow: { en: "DEDICATED CONTACT", ja: "専任の担当窓口" },
    en: "One named contact for orders, replenishment, and visiting brewers — replies in JA / EN.",
    ja: "ご注文から在庫の補充、蔵見学のご相談まで、専任の担当が日本語・英語でお応えします。",
  },
];

const process = [
  {
    num: "01",
    en: "Submit the enquiry",
    ja: "お問い合わせ",
    desc: {
      en: "Tell us about your programme, volume, and target launch in the form below. We respond within two business days.",
      ja: "フォームから、お店の構想・取扱量・開始のご希望時期をお知らせください。2 営業日以内にご返信します。",
    },
  },
  {
    num: "02",
    en: "Sample & quote",
    ja: "サンプルとお見積り",
    desc: {
      en: "We share trade pricing, lead times, and — where appropriate — sample bottles for your team to taste.",
      ja: "卸価格と納期をお伝えし、必要に応じてサンプルもご用意します。実際に味わったうえで、ご検討いただけます。",
    },
  },
  {
    num: "03",
    en: "Open the account",
    ja: "口座開設",
    desc: {
      en: "On agreement, we open a trade account and confirm payment terms, licence verification, and the first delivery.",
      ja: "条件が整いましたら、お取引口座を開設します。お支払い条件・免許の確認・初回の出荷まで、まとめてご案内します。",
    },
  },
  {
    num: "04",
    en: "Listing & rollout",
    ja: "メニューへの導入",
    desc: {
      en: "Menus, training, and shelf-talkers — we equip your team so the bottle is poured with the kura behind it.",
      ja: "メニューづくり・研修・販促物まで。一本一本に蔵の物語を添えられるよう、お店とともに整えます。",
    },
  },
];

const faqs = [
  {
    q: {
      en: "What is your minimum order quantity?",
      ja: "最低発注ロットは？",
    },
    a: {
      en: "Domestic orders begin at one case (6 bottles of 720 ml). Export and mixed-label cases vary — we tune to your programme.",
      ja: "国内は 1 ケース（720ml × 6本）より承ります。海外向けや、複数の銘柄を組み合わせたケースは、内容に応じてご相談ください。",
    },
  },
  {
    q: {
      en: "Do you ship internationally?",
      ja: "海外への輸出は可能ですか？",
    },
    a: {
      en: "Yes. We currently ship to partners across Asia, Europe, and North America via our forwarder. Tell us your destination — we will confirm route, lead time, and documentation.",
      ja: "はい、承っております。提携する輸送会社を通じて、アジア・欧州・北米への出荷実績があります。お届け先の国・地域をお知らせいただければ、輸送ルート・納期・必要書類をご案内します。",
    },
  },
  {
    q: {
      en: "Can you provide private-label or OEM bottles?",
      ja: "PB ／ OEM の対応は？",
    },
    a: {
      en: "Selectively, yes. Our kura is small, so PB programmes are accepted by capacity rather than by request — please write to us with your concept and target volume.",
      ja: "ご相談のうえで承ります。蔵の生産量には限りがあるため、ご要望の内容と取扱量を伺ったうえで、可否をお伝えします。",
    },
  },
  {
    q: {
      en: "What payment terms do you offer?",
      ja: "お支払い条件は？",
    },
    a: {
      en: "For the first order: bank transfer in advance. From the second order onward, net 30 terms are available after a brief credit review.",
      ja: "初回は前払い（銀行振込）にてお願いしております。2 回目以降は、簡単な与信のご確認のうえ、月末締め・翌月末払いのご利用も可能です。",
    },
  },
];

export default function ShopBusinessPage() {
  return (
    <main className="bg-[#FAF5E8] text-[#0B1A2E] min-h-screen">
      <FujisanNav />

      <FujisanInnerHero
        eyebrow="WHOLESALE · TRADE · 卸"
        chapter="Ⅸ.Ⅱ"
        title="FOR YOUR PROGRAMME."
        jp="― 飲食店・小売・ホスピタリティ ―"
        lead={
          <L
            en="Fujisan is poured in quiet izakayas, listed on tasting menus, and shelved in considered retailers from Shizuoka to Singapore. Open a trade account — we'll meet you bottle in hand."
            ja="富士山の酒は、静かな居酒屋で供され、テイスティングメニューに並び、静岡からシンガポールまで、選び抜かれた小売店の棚に置かれています。取扱口座の開設はこちらから。一本を携えて、ご相談に伺います。"
          />
        }
        crumbs={[
          { label: "HOME", href: "/#top" },
          { label: "PURCHASE", href: "/shop" },
          { label: "BUSINESS", href: "/shop/business" },
        ]}
        bgPosition="object-[50%_44%]"
      />

      <TradeAccessBand />

      {/* ===== Benefits ===== */}
      <section className="relative bg-[#FAF5E8]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
        />
        <div className="mx-auto max-w-[1280px] px-7 py-20 md:px-12 md:py-24">
          <Reveal className="flex items-center gap-3">
            <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
              Ⅸ.Ⅱ.i
            </span>
            <span className="h-px w-10 bg-[#C9A84C]/55" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/65">
              WHAT A TRADE ACCOUNT INCLUDES
            </span>
          </Reveal>

          <Reveal
            as="h2"
            delay={revealDelays.d1}
            className="mt-6 max-w-[720px] font-serif text-[clamp(24px,2.8vw,36px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#0B1A2E]"
          >
            <L
              en="Not a wholesaler. A small brewhouse, with a single trade desk."
              ja="卸業者ではなく、ひとつの蔵元と、ひとつの担当窓口。"
            />
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <Reveal
                key={b.num}
                delay={revealDelays.d2 + i * 0.06}
                className="flex flex-col gap-3 border-t border-[#0B1A2E]/15 pt-6"
              >
                <span className="font-serif text-[11px] font-medium tracking-[0.36em] text-[#C9A84C]">
                  {b.num}
                </span>
                <p className="text-[10px] font-semibold tracking-[0.3em] text-[#0B1A2E]/65">
                  <L en={b.eyebrow.en} ja={b.eyebrow.ja} />
                </p>
                <p className="text-[13px] leading-[1.78] text-[#1D2432]/82">
                  <L en={b.en} ja={b.ja} />
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Process (dark panel) ===== */}
      <section className="fujisan-dark-panel relative bg-[#0F1D30] text-[#F2E4C7]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#D7B46A]/40 to-transparent"
        />
        <div className="mx-auto max-w-[1280px] px-7 py-20 md:px-12 md:py-24">
          <Reveal className="flex items-center gap-3">
            <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#D7B46A]">
              Ⅸ.Ⅱ.ii
            </span>
            <span className="h-px w-10 bg-[#D7B46A]/55" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#D7B46A]/85">
              HOW WE WORK · 取引の流れ
            </span>
          </Reveal>

          <Reveal
            as="h2"
            delay={revealDelays.d1}
            className="mt-6 max-w-[720px] font-serif text-[clamp(24px,2.6vw,34px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#F2E4C7]"
          >
            <L
              en="From the first enquiry to the first pour — four quiet steps."
              ja="最初のご相談から、最初の一杯まで。静かな四つの手順。"
            />
          </Reveal>

          <ol className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-12 lg:grid-cols-4 lg:gap-x-8">
            {process.map((s, i) => (
              <Reveal
                key={s.num}
                as="li"
                delay={revealDelays.d2 + i * 0.06}
                className="relative flex flex-col gap-4 border-t border-[#F2E4C7]/14 pt-7"
              >
                <span className="font-serif text-[11px] font-medium tracking-[0.36em] text-[#D7B46A]">
                  {s.num}
                </span>
                <h3 className="font-serif text-[clamp(17px,1.6vw,21px)] font-semibold leading-[1.3] tracking-[0.04em] text-[#F2E4C7]">
                  <L en={s.en} ja={s.ja} />
                </h3>
                <p className="text-[12.5px] leading-[1.78] text-[#F2E4C7]/72">
                  <L en={s.desc.en} ja={s.desc.ja} />
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== Trade price list (role-gated) ===== */}
      <section className="relative bg-[#FAF5E8]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
        />
        <div className="mx-auto max-w-[1080px] px-7 py-20 md:px-12 md:py-24">
          <Reveal className="flex items-center gap-3">
            <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
              Ⅸ.Ⅱ.iii
            </span>
            <span className="h-px w-10 bg-[#C9A84C]/55" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/65">
              TRADE PRICE LIST · 卸価格表
            </span>
          </Reveal>

          <Reveal
            as="h2"
            delay={revealDelays.d1}
            className="mt-6 max-w-[620px] font-serif text-[clamp(24px,2.6vw,32px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#0B1A2E]"
          >
            <L
              en="Wholesale pricing, for our partners."
              ja="取扱店さまへの、卸価格。"
            />
          </Reveal>

          <Reveal className="mt-12" delay={revealDelays.d2}>
            <WholesalePriceList />
          </Reveal>
        </div>
      </section>

      {/* ===== Inquiry form ===== */}
      <section className="relative bg-[#FAF5E8]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
        />
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-14 px-7 py-20 md:px-12 md:py-24 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <Reveal className="flex items-center gap-3">
              <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
                Ⅸ.Ⅱ.iv
              </span>
              <span className="h-px w-10 bg-[#C9A84C]/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/65">
                REQUEST A QUOTE · お見積り依頼
              </span>
            </Reveal>

            <Reveal
              as="h2"
              delay={revealDelays.d1}
              className="mt-6 max-w-[560px] font-serif text-[clamp(24px,2.6vw,32px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#0B1A2E]"
            >
              <L
                en="Tell us about your programme."
                ja="貴店の構想を、お聞かせください。"
              />
            </Reveal>

            <Reveal
              as="p"
              delay={revealDelays.d2}
              className="mt-4 max-w-[520px] text-[13.5px] leading-[1.78] text-[#1D2432]/78"
            >
              <L
                en="A few minutes is enough. We reply within two business days, in Japanese or English, with pricing tailored to your business."
                ja="数分でご記入いただけます。2 営業日以内に、日本語または英語にて貴社向けのご提案をお送りします。"
              />
            </Reveal>

            <Reveal className="mt-10" delay={revealDelays.d3}>
              <WholesaleInquiryForm />
            </Reveal>
          </div>

          {/* Side: photo + direct contact */}
          <aside className="lg:border-l lg:border-[#0B1A2E]/12 lg:pl-14">
            <Reveal className="relative h-[260px] w-full overflow-hidden md:h-[320px]">
              <Image
                src="/images/fujisan/stories/izakaya.png"
                alt=""
                fill
                sizes="(min-width: 1024px) 38vw, 100vw"
                className="object-cover object-[50%_50%]"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-linear-to-t from-[#0B1A2E]/45 via-transparent to-transparent"
              />
              <p className="absolute bottom-5 left-5 font-jp text-[11.5px] tracking-[0.28em] text-[#F2E4C7]/90">
                ― 蔵から、店へ ―
              </p>
            </Reveal>

            <Reveal as="div" delay={revealDelays.d1} className="mt-10">
              <p className="text-[10px] font-semibold tracking-[0.32em] text-[#0B1A2E]/65">
                DIRECT · 取扱店専用窓口
              </p>
              <div className="mt-4 h-px w-10 bg-[#C9A84C]/55" />
              <a
                href="mailto:trade@fujisan-sake.com"
                className="group/email mt-6 inline-flex items-center gap-2 font-serif text-[16px] text-[#0B1A2E] no-underline transition-colors hover:text-[#C9A84C]"
              >
                <span className="relative pb-0.5">
                  trade@fujisan-sake.com
                  <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/35 transition-all duration-500 group-hover/email:bg-[#C9A84C]" />
                </span>
                <span
                  aria-hidden
                  className="text-[12px] transition-transform duration-500 group-hover/email:translate-x-1"
                >
                  ↗
                </span>
              </a>
              <p className="mt-4 max-w-[360px] text-[12.5px] leading-[1.7] text-[#1D2432]/76">
                <L
                  en="For listings, retail buying, and brewery visits — our trade desk replies in JA / EN within two business days."
                  ja="お取扱いのご相談・仕入れ・蔵見学のご依頼まで、専任の担当が 2 営業日以内に、日本語・英語で対応します。"
                />
              </p>
            </Reveal>

            <Reveal as="div" delay={revealDelays.d2} className="mt-10 border-t border-[#0B1A2E]/12 pt-8">
              <p className="text-[10px] font-semibold tracking-[0.32em] text-[#0B1A2E]/65">
                PHONE · 電話
              </p>
              <p className="mt-3 font-serif text-[16px] text-[#0B1A2E]">
                070-9323-4144
              </p>
              <p className="mt-2 text-[11.5px] leading-[1.7] text-[#0B1A2E]/60">
                <L
                  en="Weekdays 10:00 – 17:00 JST (excl. holidays)"
                  ja="平日 10:00 – 17:00（土日祝・年末年始を除く）"
                />
              </p>
            </Reveal>
          </aside>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="border-t border-[#0B1A2E]/10 bg-[#F4ECD9]">
        <div className="mx-auto max-w-[1180px] px-7 py-20 md:px-12 md:py-24">
          <Reveal className="flex items-center gap-3">
            <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
              Ⅸ.Ⅱ.v
            </span>
            <span className="h-px w-10 bg-[#C9A84C]/55" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/65">
              TRADE FAQ
            </span>
          </Reveal>

          <Reveal
            as="h2"
            delay={revealDelays.d1}
            className="mt-6 font-serif text-[clamp(24px,2.6vw,32px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#0B1A2E]"
          >
            <L
              en="Common trade questions."
              ja="よくいただく取引のご質問。"
            />
          </Reveal>

          <dl className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-16">
            {faqs.map((f, i) => (
              <Reveal
                key={f.q.en}
                delay={revealDelays.d2 + i * 0.06}
                className="border-t border-[#0B1A2E]/15 pt-7"
              >
                <dt className="font-serif text-[clamp(16px,1.5vw,19px)] font-semibold leading-[1.4] tracking-[0.04em] text-[#0B1A2E]">
                  <L en={f.q.en} ja={f.q.ja} />
                </dt>
                <dd className="mt-4 text-[13px] leading-[1.78] text-[#1D2432]/80">
                  <L en={f.a.en} ja={f.a.ja} />
                </dd>
              </Reveal>
            ))}
          </dl>
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}
