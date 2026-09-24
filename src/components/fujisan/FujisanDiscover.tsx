import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { L } from "@/i18n/Localized";

const features = [
  {
    num: "01",
    title: "WATER FROM MT. FUJI",
    titleJp: "富士山の湧水",
    jp: "水",
    desc: "Soft spring water, filtered through Mt. Fuji's volcanic rock for 40 to 60 years.",
    descJp: "富士山の溶岩層で40〜60年かけてこされた、軟水を使っています。",
    image: "/images/fujisan/features/water.webp",
    alt: "Spring water from Mt. Fuji",
    href: "/craft/water",
  },
  {
    num: "02",
    title: "SAKE RICE",
    titleJp: "酒造好適米",
    jp: "米",
    desc: "Yamadanishiki and Homarefuji rice, polished to 40–60%.",
    descJp: "兵庫県産の山田錦と静岡県産の誉富士を、精米歩合40〜60%まで磨いて使います。",
    image: "/images/fujisan/features/ricebox.webp",
    alt: "Sake rice",
    href: "/craft/rice",
  },
  {
    num: "03",
    title: "BREWING",
    titleJp: "伝統醸造",
    jp: "造り",
    desc: "Brewed through the winter, late October to March, by the toji and kurabito of Makino Shuzo.",
    descJp: "10月下旬から3月の冬のあいだに、牧野酒造の杜氏と蔵人が仕込みます。",
    image: "/images/fujisan/art-of-sake/ochoko.webp",
    alt: "Traditional sake brewing",
    href: "/craft/brewing",
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
              <span className="font-serif text-[11px] font-medium tracking-[0.36em] text-gold">
                Ⅰ
              </span>
              <span className="h-px w-10 bg-gold/55" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.38em] text-indigo/60">
                <L en="Discover" ja="こだわり" />
              </span>
            </Reveal>

            <Reveal
              as="h2"
              className="mt-6 font-serif text-[clamp(26px,2.9vw,42px)] font-semibold leading-[1.18] tracking-[0.1em] text-indigo"
              delay={revealDelays.d1}
            >
              <L en="WATER, RICE, BREWING" ja="水・米・造り" />
            </Reveal>
          </div>

          <Reveal
            as="p"
            className="max-w-[420px] text-[13.5px] font-light leading-[1.9] text-[#2B2419]/72 md:text-[14px] lg:justify-self-end"
            delay={revealDelays.d2}
          >
            <L
              en="How the water, the rice, and the brewing shape the Bushido series."
              ja="武士道シリーズの味を決める、水・米・造りについて説明しています。"
            />
          </Reveal>
        </div>

        {/* 要素インデックス: 番号 × サムネイル × タイトルの書誌的リスト */}
        <div className="mt-14 border-t border-indigo/12 md:mt-20">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={0.08 + i * 0.08}>
              <Link
                href={f.href}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5 border-b border-indigo/12 py-7 no-underline outline-none focus-visible:ring-2 focus-visible:ring-gold/60 sm:grid-cols-[auto_auto_minmax(0,1fr)_auto] sm:gap-8 md:py-9 lg:gap-12"
              >
                <span
                  aria-hidden
                  className="w-12 shrink-0 font-serif text-[28px] font-medium leading-none tracking-[0.08em] text-indigo/22 transition-colors duration-500 group-hover:text-gold md:w-16 md:text-[38px]"
                >
                  {f.num}
                </span>

                <span className="relative hidden h-[104px] w-[84px] shrink-0 overflow-hidden sm:block md:h-[120px] md:w-[96px]">
                  <Image
                    src={f.image}
                    alt={f.alt}
                    fill
                    sizes="96px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                </span>

                <span className="min-w-0">
                  <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                    <span className="font-serif text-[17px] font-semibold tracking-[0.14em] text-indigo transition-colors duration-500 group-hover:text-gold md:text-[21px]">
                      <L en={f.title} ja={f.titleJp} />
                    </span>
                    <span className="font-jp text-[11px] tracking-[0.3em] text-gold md:text-[11.5px]">
                      {f.jp}
                    </span>
                  </span>
                  <span className="mt-2 line-clamp-2 hidden max-w-[520px] text-[12.5px] font-light leading-[1.8] text-[#2B2419]/68 md:block">
                    <L en={f.desc} ja={f.descJp} />
                  </span>
                </span>

                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-indigo/25 text-[13px] text-indigo/70 transition-all duration-500 group-hover:border-gold group-hover:bg-gold group-hover:text-paper md:h-12 md:w-12"
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
