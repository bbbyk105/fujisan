import Image from "next/image";

const features = [
  {
    num: "01",
    eyebrow: "PURE WATER",
    title: "FROM MT. FUJI",
    jp: "富士の水",
    desc: "Our sake begins with crystal-clear snowmelt, naturally filtered through ancient volcanic rock.",
    image: "/images/fujisan/features/water.png",
    alt: "Pure water from Mt. Fuji",
  },
  {
    num: "02",
    eyebrow: "PREMIUM",
    title: "JAPANESE RICE",
    jp: "厳選米",
    desc: "We select only the finest rice, polished to perfection for a clean and refined taste.",
    image: "/images/fujisan/features/ricebox.png",
    alt: "Premium Japanese rice",
  },
  {
    num: "03",
    eyebrow: "TRADITIONAL",
    title: "BREWING",
    jp: "伝統醸造",
    desc: "Craftsmanship and time-honored techniques create sake of exceptional quality and character.",
    image: "/images/fujisan/art-of-sake/ochoko.png",
    alt: "Traditional sake brewing",
  },
];

const storyPhotos = [
  {
    src: "/images/fujisan/hero/mtfuji.png",
    alt: "Mt. Fuji reflecting on the lake at dusk",
    position: "object-[50%_50%]",
  },
  {
    src: "/images/fujisan/stories/izakaya.png",
    alt: "Traditional Japanese village street",
    position: "object-[50%_55%]",
  },
  {
    src: "/images/fujisan/art-of-sake/ochoko.png",
    alt: "Hand holding a ceramic ochoko cup",
    position: "object-[55%_50%]",
  },
];

const pairings = [
  {
    roman: "Ⅰ",
    name: "SASHIMI",
    jp: "刺身",
    desc: "Clean and delicate flavors.",
    image: "/images/fujisan/pairings/sashimi.png",
  },
  {
    roman: "Ⅱ",
    name: "TEMPURA",
    jp: "天ぷら",
    desc: "Crisp and light harmony.",
    image: "/images/fujisan/pairings/tempra.png",
  },
  {
    roman: "Ⅲ",
    name: "YAKITORI",
    jp: "焼き鳥",
    desc: "Rich and savory balance.",
    image: "/images/fujisan/pairings/yakitori.png",
  },
  {
    roman: "Ⅳ",
    name: "CHEESE",
    jp: "チーズ",
    desc: "Surprising and delightful.",
    image: "/images/fujisan/pairings/cheese.png",
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
            <article
              key={f.title}
              className="group relative min-h-[380px] overflow-hidden border-t border-[#0B1A2E]/10 md:min-h-[440px] md:border-l md:border-t-0 md:first:border-l-0"
            >
              <Image
                src={f.image}
                alt={f.alt}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.04]"
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
                  {f.eyebrow}
                </p>
                <h3 className="mt-3 font-serif text-[clamp(22px,2vw,28px)] font-semibold leading-[1.15] tracking-[0.08em] text-[#0B1A2E]">
                  {f.title}
                </h3>
                <p className="mt-2 font-jp text-[12px] tracking-[0.26em] text-[#C9A84C]/85">
                  {f.jp}
                </p>

                <p className="mt-6 max-w-[300px] text-[13px] font-light leading-[1.75] text-[#2B2419]/78 md:text-[13.5px]">
                  {f.desc}
                </p>

                <a
                  href="#"
                  className="group/link mt-10 inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline"
                >
                  <span className="relative pb-1">
                    LEARN MORE
                    <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/50 transition-all duration-500 group-hover/link:bg-[#C9A84C]" />
                  </span>
                  <span
                    aria-hidden
                    className="transition-transform duration-500 group-hover/link:translate-x-1 group-hover/link:text-[#C9A84C]"
                  >
                    →
                  </span>
                </a>
              </div>

              <span
                aria-hidden
                className="pointer-events-none absolute right-6 top-6 font-jp text-[72px] leading-none text-[#0B1A2E]/[0.035] md:text-[96px]"
              >
                {f.jp.charAt(0)}
              </span>
            </article>
          ))}
        </div>
      </section>

      {/* ===== Stories ===== */}
      <section className="bg-[#FAF5E8]">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2.4fr]">
          <div className="relative flex flex-col justify-center overflow-hidden bg-[#F1E6CB] px-10 py-14 md:px-12 md:py-16">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-4 -top-2 select-none font-jp text-[140px] leading-none text-[#0B1A2E]/[0.045] md:text-[180px]"
            >
              物語
            </span>

            <div className="relative flex items-center gap-3">
              <span className="font-serif text-[11px] font-medium tracking-[0.34em] text-[#C9A84C]">
                Ⅱ
              </span>
              <span className="h-px w-10 bg-[#C9A84C]/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#C9A84C]">
                Heritage
              </span>
            </div>

            <h2 className="relative mt-6 font-serif text-[clamp(24px,2.4vw,34px)] font-semibold leading-[1.12] tracking-[0.08em] text-[#0B1A2E]">
              STORIES OF
              <br />
              FUJISAN SAKE
            </h2>
            <p className="relative mt-3 font-jp text-[12.5px] tracking-[0.26em] text-[#C9A84C]/85">
              富士山酒物語
            </p>

            <p className="relative mt-6 max-w-[340px] text-[13px] font-light leading-[1.75] text-[#2B2419]/78 md:text-[13.5px]">
              Each bottle carries a story — of the land, the people, and the
              traditions that live on in every drop.
            </p>

            <a
              href="#"
              className="group/link relative mt-10 inline-flex items-center gap-3 self-start text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline"
            >
              <span className="relative pb-1">
                DISCOVER STORIES
                <span className="absolute inset-x-0 -bottom-0 h-px bg-[#0B1A2E]/50 transition-all duration-500 group-hover/link:bg-[#C9A84C]" />
              </span>
              <span
                aria-hidden
                className="transition-transform duration-500 group-hover/link:translate-x-1 group-hover/link:text-[#C9A84C]"
              >
                →
              </span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3">
            {storyPhotos.map((p) => (
              <div
                key={p.src}
                className="group relative min-h-[260px] overflow-hidden border-t border-[#0B1A2E]/10 sm:border-l sm:border-t-0 md:min-h-[300px]"
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  sizes="(min-width: 768px) 24vw, 100vw"
                  className={`object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.05] ${p.position}`}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0B1A2E]/25 via-transparent to-transparent"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Pairings ===== */}
      <section className="relative bg-[#0F1D30] text-[#EAD9B5]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#D7B46A]/35 to-transparent"
        />
        <div className="mx-auto grid max-w-[1480px] grid-cols-1 items-start gap-12 px-8 py-20 md:grid-cols-[0.85fr_3fr] md:gap-10 md:px-14 md:py-24">
          <div className="relative">
            <div className="flex items-center gap-3">
              <span className="font-serif text-[11px] font-medium tracking-[0.34em] text-[#D7B46A]">
                Ⅲ
              </span>
              <span className="h-px w-10 bg-[#D7B46A]/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#D7B46A]/85">
                Harmony
              </span>
            </div>

            <h2 className="mt-6 font-serif text-[clamp(24px,2.4vw,34px)] font-semibold leading-[1.12] tracking-[0.1em] text-[#F2E4C7]">
              PERFECT
              <br />
              PAIRINGS
            </h2>
            <p className="mt-3 font-jp text-[12.5px] tracking-[0.26em] text-[#D7B46A]/85">
              ― 食卓の調和 ―
            </p>

            <p className="mt-6 max-w-[260px] text-[13px] font-light leading-[1.75] text-[#F2E4C7]/75 md:text-[13.5px]">
              Enhance every moment with the perfect match for your sake.
            </p>

            <a
              href="#"
              className="group/link mt-12 inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-[#F2E4C7] no-underline"
            >
              <span className="relative pb-1">
                VIEW PAIRINGS
                <span className="absolute inset-x-0 -bottom-0 h-px bg-[#F2E4C7]/50 transition-all duration-500 group-hover/link:bg-[#D7B46A]" />
              </span>
              <span
                aria-hidden
                className="transition-transform duration-500 group-hover/link:translate-x-1 group-hover/link:text-[#D7B46A]"
              >
                →
              </span>
            </a>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-4 md:gap-x-7">
            {pairings.map((p) => (
              <figure key={p.name} className="group flex flex-col">
                <div className="relative aspect-[4/3.4] overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.name.toLowerCase()}
                    fill
                    sizes="(min-width: 768px) 18vw, 45vw"
                    className="object-cover transition-transform duration-[1600ms] ease-out group-hover:scale-[1.06]"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0F1D30]/35 via-transparent to-transparent"
                  />
                  <span className="absolute left-3 top-3 font-serif text-[11px] font-medium tracking-[0.3em] text-[#F2E4C7]/90">
                    {p.roman}
                  </span>
                </div>
                <figcaption className="mt-5">
                  <h3 className="font-serif text-[12.5px] font-semibold tracking-[0.3em] text-[#D7B46A]">
                    {p.name}
                  </h3>
                  <p className="mt-1 font-jp text-[11px] tracking-[0.22em] text-[#F2E4C7]/60">
                    {p.jp}
                  </p>
                  <span
                    aria-hidden
                    className="mt-3 block h-px w-8 bg-[#D7B46A]/45 transition-all duration-500 group-hover:w-14 group-hover:bg-[#D7B46A]"
                  />
                  <p className="mt-3 text-[12px] font-light leading-[1.6] text-[#F2E4C7]/72">
                    {p.desc}
                  </p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
