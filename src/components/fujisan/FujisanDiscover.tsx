import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal/Reveal";
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
  {
    num: "04",
    eyebrow: "HERITAGE",
    eyebrowJp: "伝承の",
    title: "FUJISAN STORIES",
    titleJp: "富士の酒の物語",
    jp: "物語",
    desc: "Each bottle carries a story — of the land, the people, and the traditions that live on in every drop.",
    descJp:
      "一本一本に、土地と人、そして一滴に息づく伝統の物語が宿ります。",
    image: "/images/fujisan/toji.png",
    imagePosition: "object-[50%_28%]",
    alt: "杜氏 — 蔵の仕込みを見守る",
    href: "/stories",
    dark: true,
  },
];

export default function FujisanDiscover() {
  return (
    <section className="relative bg-[#FAF5E8]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => {
          const dark = f.dark ?? false;
          return (
            <Reveal
              key={f.title}
              as="div"
              delay={i * 0.12}
              className="group relative min-h-[380px] overflow-hidden border-t border-[#0B1A2E]/10 sm:border-l sm:border-t-0 sm:first:border-l-0 lg:min-h-[440px]"
            >
              <Image
                src={f.image}
                alt={f.alt}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className={`object-cover ${f.imagePosition ?? ""}`}
              />
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-0 ${
                  dark
                    ? "bg-linear-to-br from-[#0B1A2E]/94 via-[#0B1A2E]/55 to-[#0B1A2E]/15"
                    : "bg-linear-to-br from-[#FAF5E8]/92 via-[#FAF5E8]/45 to-[#FAF5E8]/0"
                }`}
              />

              <div className="relative z-10 w-[78%] px-8 py-10 sm:w-[74%] md:px-9 md:py-12">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-[11px] font-medium tracking-[0.34em] text-[#C9A84C]">
                    {f.num}
                  </span>
                  <span className="h-px w-8 bg-[#C9A84C]/60 transition-all duration-500 group-hover:w-14" />
                </div>

                <p
                  className={`mt-6 text-[10.5px] font-semibold uppercase tracking-[0.34em] ${
                    dark ? "text-[#EAD9B5]/75" : "text-[#0B1A2E]/70"
                  }`}
                >
                  <L en={f.eyebrow} ja={f.eyebrowJp} />
                </p>
                <h3
                  className={`mt-3 font-serif text-[clamp(20px,1.7vw,26px)] font-semibold leading-[1.15] tracking-[0.08em] ${
                    dark ? "text-[#F2E4C7]" : "text-[#0B1A2E]"
                  }`}
                >
                  <L en={f.title} ja={f.titleJp} />
                </h3>
                <p
                  className={`mt-2 font-jp text-[12px] tracking-[0.26em] ${
                    dark ? "text-[#C9A84C]" : "text-[#C9A84C]/85"
                  }`}
                >
                  {f.jp}
                </p>

                <p
                  className={`mt-6 max-w-[300px] text-[13px] font-light leading-[1.75] md:text-[13.5px] ${
                    dark ? "text-[#F2E4C7]/80" : "text-[#2B2419]/78"
                  }`}
                >
                  <L en={f.desc} ja={f.descJp} />
                </p>

                <Link
                  href={f.href}
                  className={`group/link mt-10 inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] no-underline ${
                    dark ? "text-[#F2E4C7]" : "text-[#0B1A2E]"
                  }`}
                >
                  <span className="relative pb-1">
                    <L en="LEARN MORE" ja="詳しく見る" />
                    <span
                      className={`absolute inset-x-0 -bottom-0 h-px transition-all duration-500 group-hover/link:bg-[#C9A84C] ${
                        dark ? "bg-[#F2E4C7]/50" : "bg-[#0B1A2E]/50"
                      }`}
                    />
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
                className={`pointer-events-none absolute right-6 top-6 font-jp text-[72px] leading-none md:text-[88px] ${
                  dark ? "text-[#F2E4C7]/[0.06]" : "text-[#0B1A2E]/[0.035]"
                }`}
              >
                {f.jp.charAt(0)}
              </span>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
