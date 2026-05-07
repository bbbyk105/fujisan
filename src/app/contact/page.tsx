import Image from "next/image";
import Link from "next/link";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { FujisanInnerHero } from "@/components/fujisan/FujisanInnerHero";
import { FujisanContactForm } from "@/components/fujisan/FujisanContactForm";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";

export const metadata = {
  title: "Contact — FUJISAN SAKE",
  description:
    "Reach our small team in Yamanashi for general enquiries, trade and wholesale, brewery visits, or press requests.",
};

const channels = [
  {
    num: "Ⅰ",
    eyebrow: "GENERAL CARE",
    jp: "一般のお問い合わせ",
    address: "care@fujisan-sake.com",
    desc: "Orders, deliveries, gifting, and anything we can help with around your bottle.",
  },
  {
    num: "Ⅱ",
    eyebrow: "TRADE & WHOLESALE",
    jp: "卸・取扱店",
    address: "trade@fujisan-sake.com",
    desc: "For restaurants, bars, and retailers considering Fujisan for their programme.",
  },
  {
    num: "Ⅲ",
    eyebrow: "BREWERY VISITS",
    jp: "蔵見学",
    address: "visit@fujisan-sake.com",
    desc: "Small group visits to the kura, by appointment, between November and March.",
  },
  {
    num: "Ⅳ",
    eyebrow: "PRESS & MEDIA",
    jp: "取材・メディア",
    address: "press@fujisan-sake.com",
    desc: "Editorial features, photography requests, and review samples.",
  },
];

const hours = [
  { day: "MON — FRI", value: "09:00 — 17:00 JST" },
  { day: "SATURDAY", value: "10:00 — 15:00 JST" },
  { day: "SUNDAY · HOLIDAYS", value: "Closed" },
];

export default function ContactPage() {
  return (
    <main className="bg-[#FAF5E8] text-[#0B1A2E] min-h-screen">
      <FujisanNav />

      <FujisanInnerHero
        eyebrow="A LETTER · CONTACT"
        chapter="Ⅷ"
        title="GET IN TOUCH"
        jp="― 一献の便り、お預かりします ―"
        lead="Whether you have a question about a bottle, are considering Fujisan for your restaurant, or simply want to visit the kura — write to us. Our small team in Yamanashi reads every message by hand."
        crumbs={[
          { label: "HOME", href: "/#top" },
          { label: "CONTACT", href: "/contact" },
        ]}
        bgPosition="object-[50%_42%]"
      />

      {/* ===== Form + Channels ===== */}
      <section className="relative bg-[#FAF5E8]">
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
                Send a message
              </span>
            </Reveal>

            <Reveal
              as="h2"
              className="mt-5 max-w-[560px] font-serif text-[clamp(24px,2.6vw,34px)] font-semibold leading-[1.18] tracking-[0.06em] text-[#0B1A2E]"
              delay={revealDelays.d1}
            >
              Write to the brewhouse.
            </Reveal>

            <Reveal as="p" className="mt-4 max-w-[520px] text-[14px] font-light leading-[1.78] text-[#1D2432]/82" delay={revealDelays.d2}>
              We reply, in Japanese or English, usually within one business day.
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
                Direct
              </span>
            </Reveal>

            <Reveal
              as="h2"
              className="mt-5 font-serif text-[clamp(22px,2.2vw,28px)] font-semibold leading-[1.2] tracking-[0.06em] text-[#0B1A2E]"
              delay={revealDelays.d1}
            >
              Or write to the right desk.
            </Reveal>

            <ul className="mt-10 flex flex-col gap-9">
              {channels.map((c, i) => (
                <Reveal
                  key={c.address}
                  delay={0.12 + i * 0.08}
                  as="div"
                  className="border-t border-[#0B1A2E]/12 pt-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-serif text-[10.5px] font-medium tracking-[0.32em] text-[#C9A84C]">
                      {c.num}
                    </span>
                    <span className="text-[10px] font-semibold tracking-[0.32em] text-[#0B1A2E]/65">
                      {c.eyebrow}
                    </span>
                  </div>
                  <p className="mt-2 font-jp text-[11.5px] tracking-[0.26em] text-[#C9A84C]/85">
                    {c.jp}
                  </p>
                  <a
                    href={`mailto:${c.address}`}
                    className="group/email mt-3 inline-flex items-center gap-2 font-serif text-[15.5px] text-[#0B1A2E] no-underline transition-colors hover:text-[#C9A84C]"
                  >
                    <span className="relative pb-0.5">
                      {c.address}
                      <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/35 transition-all duration-500 group-hover/email:bg-[#C9A84C]" />
                    </span>
                    <span aria-hidden className="text-[12px] transition-transform duration-500 group-hover/email:translate-x-1">
                      ↗
                    </span>
                  </a>
                  <p className="mt-3 max-w-[360px] text-[12.5px] font-light leading-[1.7] text-[#1D2432]/76">
                    {c.desc}
                  </p>
                </Reveal>
              ))}
            </ul>
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
              src="/images/fujisan/hero/mtfuji.png"
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
                Visit · Hours
              </span>
            </Reveal>

            <Reveal
              as="h2"
              className="mt-5 font-serif text-[clamp(22px,2.2vw,28px)] font-semibold leading-[1.2] tracking-[0.06em] text-[#F2E4C7]"
              delay={revealDelays.d1}
            >
              At the foot of Fujisan.
            </Reveal>

            <Reveal as="div" className="mt-9" delay={revealDelays.d2}>
              <p className="text-[10px] font-semibold tracking-[0.32em] text-[#D7B46A]/85">
                ADDRESS
              </p>
              <p className="mt-3 font-serif text-[15px] leading-[1.78] text-[#F2E4C7]">
                〒401-0301
                <br />
                山梨県南都留郡富士河口湖町
                <br />
                船津 12-3-4
              </p>
              <p className="mt-3 text-[12.5px] font-light leading-[1.6] text-[#F2E4C7]/68">
                12-3-4 Funatsu, Fujikawaguchiko, Minamitsuru, Yamanashi 401-0301, Japan
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
                      {h.day}
                    </dt>
                    <dd className="font-serif text-[14px] text-[#F2E4C7]">
                      {h.value}
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
                  READ THE FAQ FIRST
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
