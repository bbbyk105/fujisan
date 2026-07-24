import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { L } from "@/i18n/Localized";

const features = [
  {
    num: "01",
    title: "FROM MT. FUJI",
    titleJp: "富士の水脈より",
    jp: "富士の水",
    desc: "Our sake begins with crystal-clear snowmelt, naturally filtered through ancient volcanic rock.",
    descJp:
      "太古の溶岩層をくぐり、自然にろ過された澄み切った雪解け水。私たちの酒造りは、ここから始まります。",
    image: "/images/fujisan/features/water.webp",
    alt: "Pure water from Mt. Fuji",
    href: "/craft/water",
  },
  {
    num: "02",
    title: "JAPANESE RICE",
    titleJp: "酒造好適米",
    jp: "厳選米",
    desc: "We select only the finest rice, polished to perfection for a clean and refined taste.",
    descJp: "澄んだ味わいを引き出すため、厳選した酒造好適米を丹念に磨き上げます。",
    image: "/images/fujisan/features/ricebox.webp",
    alt: "Premium Japanese rice",
    href: "/craft/rice",
  },
  {
    num: "03",
    title: "BREWING",
    titleJp: "伝統醸造",
    jp: "伝統醸造",
    desc: "Craftsmanship and time-honored techniques create sake of exceptional quality and character.",
    descJp:
      "蔵人の手仕事と、長く受け継がれた技が、唯一無二の品格を宿す一献を醸し出します。",
    image: "/images/fujisan/art-of-sake/ochoko.webp",
    alt: "Traditional sake brewing",
    href: "/craft/brewing",
  },
  {
    num: "04",
    title: "FUJISAN STORIES",
    titleJp: "富士の酒の物語",
    jp: "物語",
    desc: "Each bottle carries a story — of the land, the people, and the traditions that live on in every drop.",
    descJp: "一本一本に、土地と人、そして一滴に息づく伝統の物語が宿ります。",
    image: "/images/fujisan/features/story-kura.webp",
    imagePosition: "object-[72%_50%]",
    alt: "雪の朝、富士山を望む蔵",
    href: "/stories",
  },
];

export default function FujisanDiscover() {
  return (
    <section className="relative bg-paper">
      <div className="mx-auto max-w-[1360px] px-7 py-20 md:px-12 md:py-28">
        {/* エディトリアルヘッダー: 見出し（左） × リード文（右下揃え） */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:items-end lg:gap-16">
          <div>
            <Reveal className="flex items-center gap-4">
              <span className="font-serif text-[11px] font-medium tracking-[0.36em] text-[#C9A84C]">
                Ⅰ
              </span>
              <span className="h-px w-10 bg-[#C9A84C]/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#0B1A2E]/60">
                <L en="Discover" ja="こだわり" />
              </span>
            </Reveal>

            <Reveal
              as="h2"
              className="mt-6 font-serif text-[clamp(26px,2.9vw,42px)] font-semibold leading-[1.18] tracking-[0.1em] text-[#0B1A2E]"
              delay={revealDelays.d1}
            >
              <L en="THE ELEMENTS OF FUJISAN" ja="富士の恵みを、五感で。" />
            </Reveal>
          </div>

          <Reveal
            as="p"
            className="max-w-[420px] text-[13.5px] font-light leading-[1.9] text-[#2B2419]/72 md:text-[14px] lg:justify-self-end"
            delay={revealDelays.d2}
          >
            <L
              en="Water, rice, craft, and the stories they become. Four elements that define every bottle we brew at the foot of the mountain."
              ja="水、米、技、そして物語。麓の蔵で醸される一本一本を形づくる、4つの要素を紐解きます。"
            />
          </Reveal>
        </div>

        {/* 要素インデックス: 番号 × サムネイル × タイトルの書誌的リスト */}
        <div className="mt-14 border-t border-[#0B1A2E]/12 md:mt-20">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={0.08 + i * 0.08}>
              <Link
                href={f.href}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 border-b border-[#0B1A2E]/12 py-7 no-underline outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]/60 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto] sm:gap-8 md:py-9 lg:gap-12"
              >
                <span
                  aria-hidden
                  className="w-12 shrink-0 font-serif text-[28px] font-medium leading-none tracking-[0.08em] text-[#0B1A2E]/22 transition-colors duration-500 group-hover:text-[#C9A84C] md:w-16 md:text-[38px]"
                >
                  {f.num}
                </span>

                <span className="relative hidden h-[104px] w-[84px] shrink-0 overflow-hidden sm:block md:h-[120px] md:w-[96px]">
                  <Image
                    src={f.image}
                    alt={f.alt}
                    fill
                    sizes="96px"
                    className={`object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06] ${f.imagePosition ?? ""}`}
                  />
                </span>

                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-serif text-[17px] font-semibold tracking-[0.14em] text-[#0B1A2E] transition-colors duration-500 group-hover:text-[#C9A84C] md:text-[21px]">
                      <L en={f.title} ja={f.titleJp} />
                    </span>
                    <span className="font-jp text-[11px] tracking-[0.3em] text-[#C9A84C] md:text-[11.5px]">
                      {f.jp}
                    </span>
                  </span>
                  <span className="mt-2 line-clamp-2 hidden max-w-[520px] text-[12.5px] font-light leading-[1.8] text-[#2B2419]/68 md:block">
                    <L en={f.desc} ja={f.descJp} />
                  </span>
                </span>

                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#0B1A2E]/25 text-[13px] text-[#0B1A2E]/70 transition-all duration-500 group-hover:border-[#C9A84C] group-hover:bg-[#C9A84C] group-hover:text-paper md:h-12 md:w-12"
                >
                  →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
