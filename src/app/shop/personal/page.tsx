import Link from "next/link";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { FujisanInnerHero } from "@/components/fujisan/FujisanInnerHero";
import { ProductCollectionBottles } from "@/components/fujisan/ProductCollectionBottles";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { fujisanProducts } from "@/data/fujisan-products";
import { FUJISAN_LEGAL, UNDERAGE_NOTICE_JP } from "@/data/fujisan-legal";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "For your table — FUJISAN SAKE",
  description:
    "Order a single bottle of Fujisan sake for your home. Six expressions, nationwide delivery, age verification at every step.",
};

const yen = new Intl.NumberFormat("ja-JP");

const steps = [
  {
    num: "Ⅰ",
    en: "Choose your bottle",
    ja: "一本を選ぶ",
    desc: {
      en: "Browse six expressions of Fujisan and open the bottle that calls to you. Each detail page shows its temperature, pairings, and brewer notes.",
      ja: "六種の銘柄から、気になる一本をお選びください。各商品ページに、おすすめの温度・ペアリング・蔵元の言葉を記しています。",
    },
  },
  {
    num: "Ⅱ",
    en: "Confirm age & quantity",
    ja: "年齢の確認と、ご本数",
    desc: {
      en: "On the bottle page, confirm you are 20 years of age or older and choose how many bottles you'd like.",
      ja: "商品ページで、20歳以上であることをご確認のうえ、ご希望の本数をお選びください。",
    },
  },
  {
    num: "Ⅲ",
    en: "Receive it at home",
    ja: "ご自宅でお受け取り",
    desc: {
      en: "Hand-checked at the kura, shipped within two business days. Cool-chain available on request — the courier will verify age again at the door.",
      ja: "蔵でひとつずつ検品し、原則 2 営業日以内に発送します。クール便も承ります。お受け取りの際にも、年齢の確認をお願いいたします。",
    },
  },
];

const priceMin = Math.min(...fujisanProducts.map((p) => p.priceJpy));
const priceMax = Math.max(...fujisanProducts.map((p) => p.priceJpy));

export default function ShopPersonalPage() {
  return (
    <main className="bg-[#FAF5E8] text-[#0B1A2E] min-h-screen">
      <FujisanNav />

      <FujisanInnerHero
        eyebrow="FOR YOUR TABLE · 個人のお客様"
        chapter="Ⅸ.Ⅰ"
        title="A BOTTLE, BY THE BOTTLE."
        jp="― 一本から、家へ ―"
        lead="Single 720 ml bottles, gift-ready, shipped from our small brewhouse in Shizuoka. We hand-check every order — and verify age at order and at delivery."
        crumbs={[
          { label: "HOME", href: "/#top" },
          { label: "PURCHASE", href: "/shop" },
          { label: "PERSONAL", href: "/shop/personal" },
        ]}
        bgPosition="object-[50%_44%]"
      />

      {/* ===== Three-step flow ===== */}
      <section className="relative bg-[#FAF5E8]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
        />
        <div className="mx-auto max-w-[1280px] px-7 py-20 md:px-12 md:py-24">
          <Reveal className="flex items-center gap-3">
            <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
              Ⅸ.Ⅰ
            </span>
            <span className="h-px w-10 bg-[#C9A84C]/55" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/65">
              HOW IT WORKS · ご購入の流れ
            </span>
          </Reveal>

          <Reveal
            as="h2"
            className="mt-6 max-w-[640px] font-serif text-[clamp(24px,2.6vw,34px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#0B1A2E]"
            delay={revealDelays.d1}
          >
            <L
              en="Three quiet steps, from the kura to your door."
              ja="蔵から、玄関先まで。三つの静かな手順。"
            />
          </Reveal>

          <ol className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((s, i) => (
              <Reveal
                key={s.num}
                as="li"
                delay={revealDelays.d2 + i * 0.08}
                className="relative flex flex-col gap-4 border-t border-[#0B1A2E]/15 pt-7"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-[11px] font-medium tracking-[0.36em] text-[#C9A84C]">
                    {s.num}
                  </span>
                  <span className="text-[10px] font-semibold tracking-[0.3em] text-[#0B1A2E]/55">
                    STEP {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-serif text-[clamp(18px,1.7vw,22px)] font-semibold leading-[1.3] tracking-[0.04em] text-[#0B1A2E]">
                  <L en={s.en} ja={s.ja} />
                </h3>
                <p className="text-[13px] leading-[1.78] text-[#1D2432]/78">
                  <L en={s.desc.en} ja={s.desc.ja} />
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== Collection ===== */}
      <section className="border-t border-[#0B1A2E]/10 bg-[#F4ECD9]">
        <div className="mx-auto max-w-[1280px] px-7 py-20 md:px-12 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal className="flex items-center gap-3">
                <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
                  Ⅸ.Ⅰ.ii
                </span>
                <span className="h-px w-10 bg-[#C9A84C]/55" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/65">
                  CHOOSE YOUR BOTTLE
                </span>
              </Reveal>
              <Reveal
                as="h2"
                delay={revealDelays.d1}
                className="mt-5 max-w-[560px] font-serif text-[clamp(24px,2.6vw,32px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#0B1A2E]"
              >
                <L
                  en="Six expressions of Fujisan."
                  ja="富士山、六つの表情。"
                />
              </Reveal>
              <Reveal
                as="p"
                delay={revealDelays.d2}
                className="mt-4 max-w-[520px] text-[13.5px] leading-[1.78] text-[#1D2432]/78"
              >
                <L
                  en={`Each label is 720 ml. Prices range from ¥${yen.format(
                    priceMin,
                  )} to ¥${yen.format(priceMax)} (tax incl.). Tap a bottle to read the brewer notes and complete your order.`}
                  ja={
                    <>
                      <span className="inline-block">いずれも 720ml。</span>
                      <span className="inline-block">
                        価格は ¥{yen.format(priceMin)} 〜 ¥
                        {yen.format(priceMax)}（税込）。
                      </span>
                      <span className="inline-block">
                        気になる一本をタップして、ご注文へ。
                      </span>
                    </>
                  }
                />
              </Reveal>
            </div>
            <Reveal delay={revealDelays.d2}>
              <Link
                href="/pairings"
                className="group/link inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline"
              >
                <span className="relative pb-1">
                  <L en="OR SEE OUR PAIRINGS" ja="ペアリングから選ぶ" />
                  <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/40 transition-all duration-500 group-hover/link:bg-[#C9A84C]" />
                </span>
                <span
                  aria-hidden
                  className="transition-transform duration-500 group-hover/link:translate-x-1 group-hover/link:text-[#C9A84C]"
                >
                  →
                </span>
              </Link>
            </Reveal>
          </div>

          <ProductCollectionBottles products={fujisanProducts} columns={6} />
        </div>
      </section>

      {/* ===== Practical info: shipping · payment · age ===== */}
      <section className="border-t border-[#0B1A2E]/10 bg-[#FAF5E8]">
        <div className="mx-auto max-w-[1280px] px-7 py-20 md:px-12 md:py-24">
          <Reveal className="flex items-center gap-3">
            <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
              Ⅸ.Ⅰ.iii
            </span>
            <span className="h-px w-10 bg-[#C9A84C]/55" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/65">
              PRACTICAL · ご利用について
            </span>
          </Reveal>

          <Reveal
            as="h2"
            delay={revealDelays.d1}
            className="mt-6 max-w-[640px] font-serif text-[clamp(24px,2.6vw,32px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#0B1A2E]"
          >
            <L
              en="Shipping, payment, and the legalese in plain language."
              ja="送料・お支払い・販売条件を、わかりやすい言葉で。"
            />
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
            {[
              {
                num: "01",
                eyebrow: { en: "SHIPPING", ja: "送料" },
                body: {
                  en: FUJISAN_LEGAL.shippingFeeNoteEn,
                  ja: FUJISAN_LEGAL.shippingFeeNote,
                },
                meta: {
                  en: FUJISAN_LEGAL.deliveryTimingEn,
                  ja: FUJISAN_LEGAL.deliveryTiming,
                },
              },
              {
                num: "02",
                eyebrow: { en: "PAYMENT", ja: "お支払い" },
                body: {
                  en: FUJISAN_LEGAL.paymentMethodsEn,
                  ja: FUJISAN_LEGAL.paymentMethods,
                },
                meta: {
                  en: FUJISAN_LEGAL.paymentTimingEn,
                  ja: FUJISAN_LEGAL.paymentTiming,
                },
              },
              {
                num: "03",
                eyebrow: { en: "RETURNS", ja: "返品について" },
                body: {
                  en: "Alcohol cannot be returned for customer-side reasons. Damaged or wrongly delivered items: write within 7 days of arrival.",
                  ja: FUJISAN_LEGAL.returnsPolicy,
                },
                meta: {
                  en: "Read the full Tokutei Shōtorihiki notice for details.",
                  ja: "詳細は特定商取引法に基づく表示をご確認ください。",
                },
              },
            ].map((b) => (
              <div key={b.num} className="flex flex-col gap-4 border-t border-[#0B1A2E]/15 pt-7">
                <p className="font-serif text-[10.5px] font-medium tracking-[0.32em] text-[#C9A84C]">
                  {b.num}
                </p>
                <p className="text-[10px] font-semibold tracking-[0.3em] text-[#0B1A2E]/65">
                  <L en={b.eyebrow.en} ja={b.eyebrow.ja} />
                </p>
                <p className="text-[13px] leading-[1.78] text-[#1D2432]/82">
                  <L en={b.body.en} ja={b.body.ja} />
                </p>
                <p className="text-[11.5px] leading-[1.7] text-[#0B1A2E]/60">
                  <L en={b.meta.en} ja={b.meta.ja} />
                </p>
              </div>
            ))}
          </div>

          {/* ===== Underage notice — always JA per regulation ===== */}
          <div
            role="note"
            aria-label="未成年飲酒防止のお知らせ"
            className="mt-14 border border-[#C9A84C]/35 bg-[#F4ECD9]/80 px-6 py-5 text-[12.5px] leading-[1.8] text-[#1D2432]/86"
          >
            <p className="font-serif text-[10px] font-medium tracking-[0.32em] text-[#C9A84C]">
              AGE 20+ · 未成年飲酒防止
            </p>
            <div className="mt-3 space-y-1">
              {UNDERAGE_NOTICE_JP.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-6">
            <Link
              href={`/products/${fujisanProducts[0].slug}`}
              className="group/btn inline-flex items-center justify-center gap-3 border border-[#0B1A2E] bg-[#0B1A2E] px-8 py-4 text-[10.5px] font-semibold tracking-[0.34em] text-[#F8F3E7] no-underline transition-colors hover:bg-[#1D2432]"
            >
              <L en="START WITH OUR FLAGSHIP" ja="代表銘柄から選ぶ" />
              <span aria-hidden className="transition-transform duration-500 group-hover/btn:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/contact"
              className="group/link inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline"
            >
              <span className="relative pb-1">
                <L en="QUESTIONS? WRITE TO US" ja="ご質問はこちら" />
                <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/40 transition-all duration-500 group-hover/link:bg-[#C9A84C]" />
              </span>
              <span
                aria-hidden
                className="transition-transform duration-500 group-hover/link:translate-x-1 group-hover/link:text-[#C9A84C]"
              >
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}
