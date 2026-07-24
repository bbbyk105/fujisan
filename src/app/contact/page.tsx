import Image from "next/image";
import Link from "next/link";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { FujisanInnerHero } from "@/components/fujisan/FujisanInnerHero";
import { FujisanContactForm } from "@/components/fujisan/FujisanContactForm";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { L } from "@/i18n/Localized";

export const metadata = {
  title: "Contact — FUJISAN SAKE",
  description:
    "Reach our small team in Shizuoka for general enquiries, trade and wholesale, brewery visits, or press requests.",
};

const CONTACT_EMAIL = "mtfujipharmacy@gmail.com";

const promises = [
  {
    label: <L en="REPLY TIME" ja="返信目安" />,
    value: <L en="Within one business day" ja="通常1営業日以内にご返信" />,
  },
  {
    label: <L en="LANGUAGES" ja="対応言語" />,
    value: <L en="Japanese & English" ja="日本語・英語" />,
  },
];

const hours = [
  {
    day: "MON — FRI",
    dayJa: "月 — 金",
    value: "09:00 — 17:00 JST",
    valueJa: "09:00 — 17:00 JST",
  },
  {
    day: "SATURDAY",
    dayJa: "土曜",
    value: "10:00 — 15:00 JST",
    valueJa: "10:00 — 15:00 JST",
  },
  {
    day: "SUNDAY · HOLIDAYS",
    dayJa: "日曜・祝日",
    value: "Closed",
    valueJa: "休業",
  },
];

export default function ContactPage() {
  return (
    <main className="flex min-h-screen flex-col bg-paper text-[#0B1A2E]">
      <FujisanNav />

      <FujisanInnerHero
        eyebrow="A LETTER · CONTACT"
        chapter="Ⅷ"
        title="GET IN TOUCH"
        jp="― 一献の便り、お預かりします ―"
        lead={
          <L
            en="Whether you have a question about a bottle, are considering Fujisan for your restaurant, or simply want to visit the kura — write to us. Our small team in Shizuoka reads every message by hand."
            ja="一本についてのご質問も、お店での採用のご相談も、蔵見学のお問い合わせも。どうぞお気軽にご連絡ください。静岡の小さなチームが、いただいたお便りにひとつずつ目を通します。"
          />
        }
        crumbs={[
          { label: "HOME", href: "/#top" },
          { label: "CONTACT", href: "/contact" },
        ]}
        bgSrc="/images/lake.webp"
        bgPosition="object-[50%_42%]"
      />

      {/* ===== Form + Channels ===== */}
      <section className="relative bg-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
        />
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-14 px-7 py-20 lg:grid-cols-[1.15fr_1fr] lg:gap-20 md:px-12 md:py-24">
          {/* Form */}
          <div>
            <Reveal className="flex items-center gap-3">
              <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
                Ⅷ.I
              </span>
              <span className="h-px w-10 bg-[#C9A84C]/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/65">
                <L en="Send a message" ja="メッセージを送る" />
              </span>
            </Reveal>

            <Reveal
              as="h2"
              className="mt-5 max-w-[560px] font-serif text-[clamp(24px,2.6vw,34px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#0B1A2E]"
              delay={revealDelays.d1}
            >
              <L en="Write to the brewhouse." ja="蔵元へ、お便りを。" />
            </Reveal>

            <Reveal delay={revealDelays.d2}>
              <span className="fujisan-hairline mt-6 block h-px w-16 bg-[#C9A84C]" />
            </Reveal>

            <Reveal
              as="p"
              className="mt-4 max-w-[520px] text-[14px] font-light leading-[1.78] text-[#1D2432]/82"
              delay={revealDelays.d2}
            >
              <L
                en="We reply, in Japanese or English, usually within one business day."
                ja="日本語・英語のどちらでも、通常1営業日以内にご返信します。"
              />
            </Reveal>

            <Reveal className="mt-10" delay={revealDelays.d3}>
              <FujisanContactForm />
            </Reveal>
          </div>

          {/* Direct channels */}
          <aside className="lg:border-l lg:border-[#0B1A2E]/12 lg:pl-14">
            <Reveal className="flex items-center gap-3">
              <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#C9A84C]">
                Ⅷ.II
              </span>
              <span className="h-px w-10 bg-[#C9A84C]/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/65">
                <L en="Direct" ja="直接のご連絡" />
              </span>
            </Reveal>

            <Reveal
              as="h2"
              className="mt-5 font-serif text-[clamp(22px,2.2vw,28px)] font-semibold leading-[1.2] tracking-[0.06em] text-[#0B1A2E]"
              delay={revealDelays.d1}
            >
              <L en="Or write to us directly." ja="メールでも、直接どうぞ。" />
            </Reveal>

            <Reveal delay={revealDelays.d2}>
              <span className="fujisan-hairline mt-6 block h-px w-16 bg-[#C9A84C]" />
            </Reveal>

            {/* 窓口は一つのメールアドレスに集約。用件はメール本文でお知らせください。 */}
            <Reveal as="div" delay={revealDelays.d2} className="mt-7">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="group/email inline-flex items-center gap-2 font-serif text-[clamp(18px,1.8vw,22px)] text-[#0B1A2E] no-underline transition-colors hover:text-[#C9A84C]"
              >
                <span className="relative pb-0.5">
                  {CONTACT_EMAIL}
                  <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/35 transition-all duration-500 group-hover/email:bg-[#C9A84C]" />
                </span>
                <span
                  aria-hidden
                  className="text-[13px] transition-transform duration-500 group-hover/email:translate-x-1"
                >
                  ↗
                </span>
              </a>
              <p className="mt-4 max-w-[400px] text-[12.5px] font-light leading-[1.7] text-[#1D2432]/76">
                <L
                  en="All enquiries reach the same small desk in Shizuoka. A short note about your purpose helps us reply faster."
                  ja="どのご用件も、静岡の同じ窓口でお受けしています。ご用件を一言添えていただけると、よりスムーズにご返信できます。"
                />
              </p>
            </Reveal>

            {/* 返信の約束 — 窓口の安心材料を3行で */}
            <Reveal as="div" delay={revealDelays.d3} className="mt-10">
              <p className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.36em] text-[#0B1A2E]/65">
                <L en="Our promise" ja="お返事の約束" />
                <span aria-hidden className="h-px flex-1 bg-[#0B1A2E]/12" />
              </p>
              <dl className="mt-5 flex flex-col">
                {promises.map((p, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1 border-t border-[#0B1A2E]/12 py-3.5 last:border-b sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                  >
                    <dt className="text-[10px] font-semibold tracking-[0.28em] text-[#C9A84C]">
                      {p.label}
                    </dt>
                    <dd className="font-serif text-[13px] tracking-[0.04em] text-[#0B1A2E] sm:text-right">
                      {p.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </aside>
        </div>
      </section>

      {/* ===== Brewery + Hours (dark) ===== */}
      <section className="relative bg-[#0F1D30] text-[#F2E4C7]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#D7B46A]/40 to-transparent"
        />
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 lg:grid-cols-[1fr_1fr]">
          <div className="relative min-h-[300px] overflow-hidden md:min-h-[440px]">
            <Image
              src="/images/fujisan/hero/mtfuji.webp"
              alt="Mt. Fuji at the foot of the brewery"
              fill
              priority
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[50%_46%]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-transparent to-[#0F1D30]/60"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0F1D30]/45 via-transparent to-transparent"
            />
            <div className="absolute bottom-6 left-6 max-w-[320px] sm:bottom-10 sm:left-10">
              <p className="font-jp text-[11px] tracking-[0.32em] text-[#D7B46A]/85">
                ― 蔵元の所在 ―
              </p>
              <p className="mt-3 font-serif text-[clamp(18px,1.8vw,22px)] font-semibold leading-[1.35] tracking-[0.06em] text-[#F2E4C7]">
                FUJISAN BREWHOUSE
              </p>
              <p className="mt-1 font-serif text-[12px] tracking-[0.22em] text-[#F2E4C7]/72">
                富士山酒造
              </p>
            </div>
          </div>

          <div className="fujisan-dark-panel relative px-7 py-16 sm:px-10 md:px-14 md:py-20">
            <span
              aria-hidden
              className="fujisan-breathe pointer-events-none absolute right-6 top-6 select-none font-jp text-[160px] leading-none text-[#D7B46A]/[0.06] md:text-[200px]"
            >
              便
            </span>

            <Reveal className="flex items-center gap-3">
              <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#D7B46A]">
                Ⅷ.III
              </span>
              <span className="h-px w-10 bg-[#D7B46A]/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#D7B46A]/85">
                <L en="Visit · Hours" ja="ご来訪・営業時間" />
              </span>
            </Reveal>

            <Reveal
              as="h2"
              className="mt-5 font-serif text-[clamp(22px,2.2vw,28px)] font-semibold leading-[1.2] tracking-[0.06em] text-[#F2E4C7]"
              delay={revealDelays.d1}
            >
              <L en="At the foot of Fujisan." ja="富士山の麓で。" />
            </Reveal>

            <Reveal delay={revealDelays.d2}>
              <span className="fujisan-hairline mt-6 block h-px w-16 bg-[#D7B46A]" />
            </Reveal>

            <Reveal as="div" className="mt-9" delay={revealDelays.d2}>
              <p className="text-[10px] font-semibold tracking-[0.32em] text-[#D7B46A]/85">
                <L en="ADDRESS" ja="所在地" />
              </p>
              <p className="mt-3 font-serif text-[15px] leading-[1.78] text-[#F2E4C7]">
                〒417-0051
                <br />
                静岡県富士市吉原 2-8-21
              </p>
              <p className="mt-3 text-[12.5px] font-light leading-[1.6] text-[#F2E4C7]/68">
                2-8-21 Yoshiwara, Fuji, Shizuoka 417-0051, Japan
              </p>
            </Reveal>

            <Reveal as="div" className="mt-9" delay={revealDelays.d3}>
              <p className="text-[10px] font-semibold tracking-[0.32em] text-[#D7B46A]/85">
                HOURS · 営業時間
              </p>
              <dl className="mt-4 flex flex-col gap-3">
                {hours.map((h) => (
                  <div
                    key={h.day}
                    className="flex items-baseline justify-between gap-4 border-b border-[#F2E4C7]/12 pb-3 text-[12.5px]"
                  >
                    <dt className="font-semibold tracking-[0.24em] text-[#F2E4C7]/70">
                      <L en={h.day} ja={h.dayJa} />
                    </dt>
                    <dd className="font-serif text-[14px] text-[#F2E4C7]">
                      <L en={h.value} ja={h.valueJa} />
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal className="mt-10" delay={revealDelays.d3 + 0.1}>
              <Link
                href="/faq"
                className="group/link inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-[#F2E4C7] no-underline"
              >
                <span className="relative pb-1">
                  <L en="READ THE FAQ FIRST" ja="まず FAQ をご覧ください" />
                  <span className="absolute inset-x-0 -bottom-0 h-px bg-[#F2E4C7]/50 transition-all duration-500 group-hover/link:bg-[#D7B46A]" />
                </span>
                <span
                  aria-hidden
                  className="transition-transform duration-500 group-hover/link:translate-x-1 group-hover/link:text-[#D7B46A]"
                >
                  →
                </span>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}
