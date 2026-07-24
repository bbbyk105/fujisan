import Image from "next/image";
import Link from "next/link";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { FujisanInnerHero } from "@/components/fujisan/FujisanInnerHero";
import { WholesalePriceList } from "@/components/fujisan/WholesalePriceList";
import { FUJISAN_LEGAL } from "@/data/fujisan-legal";
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
    eyebrow: { en: "BREWER SUPPORT", ja: "醸造元との連携" },
    en: "Tasting notes, serving guides, and staff training at major rollouts — arranged with Makino Shuzo, the kura that brews the Bushido series.",
    ja: "テイスティングノート、提供時の資料、本格導入時の店舗研修まで、醸造元の牧野酒造合資会社と連携してお手伝いします。",
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
      en: "Tell us about your programme, volume, and target launch via the contact form. We respond within two business days.",
      ja: "お問い合わせフォームから、業態・想定される取扱量・導入のご希望時期をお知らせください。2 営業日以内に担当よりご返信します。",
    },
  },
  {
    num: "02",
    en: "Sample & quote",
    ja: "サンプルとお見積り",
    desc: {
      en: "We share trade pricing, lead times, and — where appropriate — sample bottles for your team to taste.",
      ja: "内容を伺ったうえで、卸価格と納期をご提示します。ご希望に応じてサンプルもお送りしますので、実際に味わってからご検討ください。",
    },
  },
  {
    num: "03",
    en: "Open the account",
    ja: "口座開設",
    desc: {
      en: "Once licence verification and payment terms are agreed, we open your trade account and arrange the first delivery.",
      ja: "酒類販売免許とお支払い条件を確認のうえ、お取引口座を開設します。開設後は、初回のご注文からすみやかに出荷いたします。",
    },
  },
  {
    num: "04",
    en: "Listing & rollout",
    ja: "メニューへの導入",
    desc: {
      en: "Menus, training, and shelf-talkers — we equip your team so the bottle is poured with the kura behind it.",
      ja: "メニューへの掲載からスタッフ研修、販促物のご用意まで、導入後も私たちがお手伝いします。お客様に銘柄の背景まで伝えられるお店づくりを、ともに進めます。",
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
      en: "Domestic orders begin at one case (300 ml × 12 or 180 ml × 24 bottles). Export shipments start at an MOQ of 3,000 bottles, mixed SKUs allowed — we tune to your programme.",
      ja: "国内は 1 ケース（300ml × 12本／180ml × 24本）より承ります。輸出は 1 出荷 3,000 本（銘柄混載可）が最小ロットです。内容に応じてご相談ください。",
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
    <main className="bg-paper text-[#0B1A2E] min-h-screen">
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
      <section className="relative bg-paper">
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
              en="One kura's sake, one trade desk."
              ja="ひとつの蔵で醸した酒を、ひとつの窓口から。"
            />
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((b, i) => (
              <Reveal
                key={b.num}
                as="article"
                delay={revealDelays.d2 + i * 0.06}
                className="group flex flex-col border border-[#0B1A2E]/12 bg-paper-card px-7 py-9 transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:border-[#C9A84C]/55 hover:shadow-[0_20px_44px_-28px_rgba(11,26,46,0.4)]"
              >
                <span className="font-serif text-[30px] font-semibold leading-none tracking-[0.06em] text-[#C9A84C]">
                  {b.num}
                </span>
                <span
                  aria-hidden
                  className="mt-6 h-px w-8 bg-[#C9A84C]/55 transition-[width,background-color] duration-500 group-hover:w-14 group-hover:bg-[#C9A84C]"
                />
                <h3 className="mt-5 text-[10px] font-semibold tracking-[0.3em] text-[#0B1A2E]/70">
                  <L en={b.eyebrow.en} ja={b.eyebrow.ja} />
                </h3>
                <p className="mt-4 text-[13px] leading-[1.78] text-[#1D2432]/82">
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

          <ol className="relative mt-16 grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-x-12 lg:grid-cols-4 lg:gap-x-8">
            {/* デスクトップでは全ステップを貫く進行ライン */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-8 inset-x-0 hidden h-px bg-linear-to-r from-[#D7B46A]/50 via-[#F2E4C7]/16 to-[#F2E4C7]/8 lg:block"
            />
            {process.map((s, i) => (
              <Reveal
                key={s.num}
                as="li"
                delay={revealDelays.d2 + i * 0.06}
                className="relative flex flex-col gap-4 border-t border-[#F2E4C7]/14 pt-7 lg:border-t-0 lg:pt-0"
              >
                <span
                  aria-hidden
                  className="absolute -top-[35px] left-0 hidden h-[7px] w-[7px] rotate-45 border border-[#D7B46A]/70 bg-[#0F1D30] lg:block"
                />
                <div className="flex items-baseline gap-4">
                  <span className="font-serif text-[38px] font-semibold leading-none text-[#D7B46A]/35">
                    {s.num}
                  </span>
                  <span
                    aria-hidden
                    className="mb-1 h-px w-6 shrink-0 bg-[#D7B46A]/45"
                  />
                </div>
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
      <section className="relative bg-paper">
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

      {/* ===== Contact ===== */}
      <section className="relative bg-paper">
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
                CONTACT · お問い合わせ
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
                en="Share your programme, volume, and target launch via the contact form, or reach the trade desk directly by email or phone. We reply within two business days, in Japanese or English."
                ja="業態や想定される取扱量、開始のご希望時期を、お問い合わせフォーム、または取扱店専用窓口（メール・お電話）よりお知らせください。2 営業日以内に、日本語または英語でご返信します。"
              />
            </Reveal>

            <Reveal className="mt-10" delay={revealDelays.d3}>
              <Link
                href="/contact"
                className="group inline-flex items-center gap-3 border border-[#0B1A2E]/25 bg-paper-card px-8 py-4 text-[12px] font-semibold tracking-[0.22em] text-[#0B1A2E] no-underline transition-colors duration-300 hover:border-[#C9A84C] hover:text-[#C9A84C]"
              >
                <L en="GO TO CONTACT" ja="お問い合わせフォームへ" />
                <span
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </Reveal>
          </div>

          {/* Side: photo + direct contact */}
          <aside className="self-start lg:sticky lg:top-28 lg:border-l lg:border-[#0B1A2E]/12 lg:pl-14">
            <Reveal className="relative h-[260px] w-full overflow-hidden md:h-[320px]">
              <Image
                src="/images/direct-to-cus.webp"
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
              <p className="text-[11px] tracking-[0.12em] text-[#0B1A2E]/60">
                <L en="Trade desk" ja="取扱店窓口" />
              </p>
              <a
                href={`mailto:${FUJISAN_LEGAL.email}`}
                className="mt-3 block font-serif text-[16px] text-[#0B1A2E] underline decoration-[#0B1A2E]/30 underline-offset-4 transition-colors hover:text-[#C9A84C]"
              >
                {FUJISAN_LEGAL.email}
              </a>
            </Reveal>
          </aside>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="border-t border-[#0B1A2E]/10 bg-paper-tint">
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

          <div className="mt-14 border-t border-[#0B1A2E]/15">
            {faqs.map((f, i) => (
              <Reveal key={f.q.en} delay={revealDelays.d2 + i * 0.05}>
                <details className="group border-b border-[#0B1A2E]/15">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 transition-colors hover:bg-[#F1E6CB]/35 md:py-7 [&::-webkit-details-marker]:hidden">
                    <span className="flex items-baseline gap-5 px-1 md:px-2">
                      <span className="w-7 shrink-0 font-serif text-[11px] font-medium tracking-[0.2em] text-[#C9A84C]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-serif text-[clamp(16px,1.5vw,19px)] font-semibold leading-[1.4] tracking-[0.04em] text-[#0B1A2E]">
                        <L en={f.q.en} ja={f.q.ja} />
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className="relative mr-1 h-3.5 w-3.5 shrink-0 text-[#0B1A2E]/55 transition-[transform,color] duration-300 group-open:rotate-45 group-open:text-[#C9A84C] md:mr-2"
                    >
                      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
                      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current" />
                    </span>
                  </summary>
                  <p className="max-w-[760px] px-1 pb-7 text-[13px] leading-[1.82] text-[#1D2432]/80 md:px-2 md:pl-[60px]">
                    <L en={f.a.en} ja={f.a.ja} />
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}
