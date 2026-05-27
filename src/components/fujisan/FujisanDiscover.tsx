import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { L } from "@/i18n/Localized";

const features = [
  {
    num: "01",
    eyebrow: "PURE WATER",
    eyebrowJp: "清らかな",
    title: "FROM MT. FUJI",
    titleJp: "富士の水脈より",
    jp: "富士の水",
    desc: "Our sake begins with crystal-clear snowmelt, naturally filtered through ancient volcanic rock.",
    descJp:
      "太古の溶岩層をくぐり、自然にろ過された澄み切った雪解け水。私たちの酒造りは、ここから始まります。",
    image: "/images/fujisan/features/water.png",
    alt: "Pure water from Mt. Fuji",
    href: "/craft/water",
  },
  {
    num: "02",
    eyebrow: "PREMIUM",
    eyebrowJp: "選り抜きの",
    title: "JAPANESE RICE",
    titleJp: "酒造好適米",
    jp: "厳選米",
    desc: "We select only the finest rice, polished to perfection for a clean and refined taste.",
    descJp:
      "澄んだ味わいを引き出すため、厳選した酒造好適米を丹念に磨き上げます。",
    image: "/images/fujisan/features/ricebox.png",
    alt: "Premium Japanese rice",
    href: "/craft/rice",
  },
  {
    num: "03",
    eyebrow: "TRADITIONAL",
    eyebrowJp: "伝承の",
    title: "BREWING",
    titleJp: "伝統醸造",
    jp: "伝統醸造",
    desc: "Craftsmanship and time-honored techniques create sake of exceptional quality and character.",
    descJp:
      "蔵人の手仕事と、長く受け継がれた技が、唯一無二の品格を宿す一献を醸し出します。",
    image: "/images/fujisan/art-of-sake/ochoko.png",
    alt: "Traditional sake brewing",
    href: "/craft/brewing",
  },
];

const storyPhotos = [
  {
    src: "/images/fujisan/hero/mtfuji.png",
    alt: "Mt. Fuji reflecting on the lake at dusk",
    position: "object-[50%_50%]",
  },
  {
    src: "/images/fujisan/toji.png",
    alt: "杜氏 — 蔵の仕込みを見守る",
    position: "object-[50%_28%]",
  },
  {
    src: "/images/fujisan/art-of-sake/ochoko.png",
    alt: "Hand holding a ceramic ochoko cup",
    position: "object-[55%_50%]",
  },
];

export default function FujisanDiscover() {
  return (
    <>
      {/* ===== Virtues — three-up feature row ===== */}
      <section className="relative bg-[#FAF5E8]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
        />
        <div className="grid grid-cols-1 md:grid-cols-3">
          {features.map((f, i) => (
            <Reveal
              key={f.title}
              as="div"
              delay={i * 0.14}
              className="group relative min-h-[380px] overflow-hidden border-t border-[#0B1A2E]/10 md:min-h-[440px] md:border-l md:border-t-0 md:first:border-l-0"
            >
              <Image
                src={f.image}
                alt={f.alt}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-linear-to-br from-[#FAF5E8]/92 via-[#FAF5E8]/45 to-[#FAF5E8]/0"
              />

              <div className="relative z-10 w-[74%] px-8 py-10 sm:w-[64%] md:w-[62%] md:px-10 md:py-12">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-[11px] font-medium tracking-[0.34em] text-[#C9A84C]">
                    {f.num}
                  </span>
                  <span className="h-px w-8 bg-[#C9A84C]/60 transition-all duration-500 group-hover:w-14" />
                </div>

                <p className="mt-6 text-[10.5px] font-semibold uppercase tracking-[0.34em] text-[#0B1A2E]/70">
                  <L en={f.eyebrow} ja={f.eyebrowJp} />
                </p>
                <h3 className="mt-3 font-serif text-[clamp(22px,2vw,28px)] font-semibold leading-[1.15] tracking-[0.08em] text-[#0B1A2E]">
                  <L en={f.title} ja={f.titleJp} />
                </h3>
                <p className="mt-2 font-jp text-[12px] tracking-[0.26em] text-[#C9A84C]/85">
                  {f.jp}
                </p>

                <p className="mt-6 max-w-[300px] text-[13px] font-light leading-[1.75] text-[#2B2419]/78 md:text-[13.5px]">
                  <L en={f.desc} ja={f.descJp} />
                </p>

                <Link
                  href={f.href}
                  className="group/link mt-10 inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline"
                >
                  <span className="relative pb-1">
                    <L en="LEARN MORE" ja="詳しく見る" />
                    <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/50 transition-all duration-500 group-hover/link:bg-[#C9A84C]" />
                  </span>
                  <span
                    aria-hidden
                    className="transition-transform duration-500 group-hover/link:translate-x-1 group-hover/link:text-[#C9A84C]"
                  >
                    →
                  </span>
                </Link>
              </div>

              <span
                aria-hidden
                className="pointer-events-none absolute right-6 top-6 font-jp text-[72px] leading-none text-[#0B1A2E]/[0.035] md:text-[96px]"
              >
                {f.jp.charAt(0)}
              </span>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== Stories ===== */}
      <section className="bg-[#FAF5E8]">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2.4fr]">
          <div className="relative flex flex-col justify-center overflow-hidden bg-[#F1E6CB] px-10 py-14 md:px-12 md:py-16">
            <span
              aria-hidden
              className="fujisan-breathe pointer-events-none absolute -right-4 -top-2 select-none font-jp text-[140px] leading-none text-[#0B1A2E]/[0.045] md:text-[180px]"
              style={{ animationDelay: "2s" }}
            >
              物語
            </span>

            <Reveal className="relative flex items-center gap-3">
              <span className="font-serif text-[11px] font-medium tracking-[0.34em] text-[#C9A84C]">
                Ⅱ
              </span>
              <span className="h-px w-10 bg-[#C9A84C]/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#C9A84C]">
                <L en="Heritage" ja="伝承" />
              </span>
            </Reveal>

            <Reveal
              as="h2"
              className="relative mt-6 font-serif text-[clamp(24px,2.4vw,34px)] font-semibold leading-[1.12] tracking-[0.08em] text-[#0B1A2E]"
              delay={revealDelays.d1}
            >
              <L
                en={
                  <>
                    STORIES OF
                    <br />
                    FUJISAN SAKE
                  </>
                }
                ja={
                  <>
                    富士の酒の
                    <br />
                    物語
                  </>
                }
              />
            </Reveal>
            <Reveal
              as="p"
              className="relative mt-3 font-jp text-[12.5px] tracking-[0.26em] text-[#C9A84C]/85"
              delay={revealDelays.d2}
            >
              富士の酒、その物語
            </Reveal>

            <Reveal
              as="p"
              className="relative mt-6 max-w-[340px] text-[13px] font-light leading-[1.75] text-[#2B2419]/78 md:text-[13.5px]"
              delay={revealDelays.d3}
            >
              <L
                en="Each bottle carries a story — of the land, the people, and the traditions that live on in every drop."
                ja="一本一本に、土地と人、そして一滴に息づく伝統の物語が宿ります。"
              />
            </Reveal>

            <Link
              href="/stories"
              className="group/link relative mt-10 inline-flex items-center gap-3 self-start text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline"
            >
              <span className="relative pb-1">
                <L en="DISCOVER STORIES" ja="物語を読む" />
                <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/50 transition-all duration-500 group-hover/link:bg-[#C9A84C]" />
              </span>
              <span
                aria-hidden
                className="transition-transform duration-500 group-hover/link:translate-x-1 group-hover/link:text-[#C9A84C]"
              >
                →
              </span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3">
            {storyPhotos.map((p, i) => (
              <Reveal
                key={p.src}
                delay={i * 0.14}
                className="group relative min-h-[260px] overflow-hidden border-t border-[#0B1A2E]/10 sm:border-l sm:border-t-0 md:min-h-[300px]"
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(min-width: 768px) 24vw, 100vw"
                  className={`object-cover ${p.position}`}
                  {...(p.src === "/images/fujisan/hero/mtfuji.png"
                    ? {
                        loading: "lazy" as const,
                        fetchPriority: "low" as const,
                      }
                    : {})}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0B1A2E]/25 via-transparent to-transparent"
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
