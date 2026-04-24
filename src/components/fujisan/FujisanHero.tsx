import Image from "next/image";

type Product = {
  name: string;
  variant: string;
  smv: string;
  title: string;
  desc: string;
  img: string;
};

const products: Product[] = [
  {
    name: "FUJISAN",
    variant: "TOKUBETSU\nHONJOZO",
    smv: "SMV +2",
    title: "Crisp & Refined",
    desc: "Balanced and easy-drinking\nwith a clean finish.",
    img: "/images/bushido/honjozo_02.png",
  },
  {
    name: "FUJISAN",
    variant: "TOKUBETSU\nJUNMAI",
    smv: "SMV +1",
    title: "Smooth & Elegant",
    desc: "Soft aroma with a mellow,\nsmooth flavor.",
    img: "/images/bushido/honjozo_01.png",
  },
  {
    name: "FUJISAN",
    variant: "JUNMAI\nDAIGINJO SAKE",
    smv: "SMV −1",
    title: "Fruity & Aromatic",
    desc: "Fruity notes with a delicate\nand graceful taste.",
    img: "/images/bushido/junmai_daiginjo_01.png",
  },
  {
    name: "FUJISAN",
    variant: "JUNMAI\nDAIGINJO",
    smv: "SMV ±0",
    title: "Rich & Full-Bodied",
    desc: "Deep umami with a\nluxurious, lingering finish.",
    img: "/images/bushido/junmai_daiginjo_02.png",
  },
  {
    name: "FUJISAN",
    variant: "TOKUBETSU\nJUNMAI",
    smv: "SMV +3",
    title: "Bold & Fresh",
    desc: "Vibrant and lively with\na crisp, refreshing taste.",
    img: "/images/bushido/junmai_ginjo_01.png",
  },
  {
    name: "FUJISAN",
    variant: "JUNMAI\nGINJO SAKE",
    smv: "SMV +2",
    title: "Aromatic & Light",
    desc: "Floral aroma with a\nlight and smooth texture.",
    img: "/images/bushido/junmai_ginjo_02.png",
  },
];

export default function FujisanHero() {
  return (
    <section id="top" className="relative bg-[#FAF5E8]">
      <div className="relative">
        <div className="relative h-[860px] md:h-[780px] lg:h-[820px] overflow-hidden">
          <Image
            src="/images/site/mtfuji.png"
            alt="Mt. Fuji at sunrise"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-[#F8ECD0]/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-linear-to-b from-transparent via-[#FAF5E8]/55 to-[#FAF5E8]" />
        </div>

        <div
          id="showcase"
          className="absolute inset-x-0 top-0 z-10 pt-24 md:pt-28 px-6 md:px-12 pointer-events-none"
        >
          <div className="max-w-[1360px] mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_auto] gap-10 items-start pointer-events-auto">
            <div className="max-w-[640px]">
              <h1 className="font-serif text-[#0C1B30] leading-[1.08] tracking-[0.01em]">
                <span className="block text-[clamp(20px,2.6vw,30px)] font-normal tracking-[0.06em]">
                  THE SPIRIT OF JAPAN,
                </span>
                <span className="block text-[clamp(20px,2.6vw,30px)] font-normal tracking-[0.06em] mt-1">
                  CRAFTED AT THE FOOT OF
                </span>
                <span className="block font-serif font-semibold text-[clamp(64px,12vw,160px)] tracking-[0.01em] mt-3 leading-[0.92] text-[#0B1A2E]">
                  FUJISAN
                </span>
              </h1>

              <p className="font-jp text-[clamp(15px,1.5vw,18px)] text-[#2E2619] mt-4 tracking-[0.2em]">
                — 富士の恵み、伝統の一滴 —
              </p>

              <p className="text-[clamp(13px,1vw,15px)] text-[#2B2419]/85 leading-[1.85] mt-7 max-w-[340px]">
                From the pure snowmelt of Mt. Fuji
                <br />
                to masterful brewing, discover a sake
                <br />
                collection that embodies Japan&apos;s
                <br />
                heritage and natural beauty.
              </p>
            </div>

            <div
              className="hidden lg:flex flex-row-reverse items-start gap-5 pt-4 pr-2 text-[#0B1A2E]"
              aria-hidden
            >
              <div className="flex flex-col items-center gap-4">
                <span
                  className="font-jp font-semibold tracking-[0.06em]"
                  style={{
                    writingMode: "vertical-rl",
                    fontSize: "clamp(72px, 8.6vw, 118px)",
                    lineHeight: 1.04,
                  }}
                >
                  富士山
                </span>
                <span className="inline-flex items-center justify-center w-7 h-7 border border-crimson text-crimson text-[9px] tracking-wider">
                  富
                </span>
              </div>
              <span
                className="font-jp font-normal tracking-[0.36em] text-[#0B1A2E]/82"
                style={{
                  writingMode: "vertical-rl",
                  fontSize: "clamp(13px, 1.25vw, 16px)",
                }}
              >
                日本の美、酒の心
              </span>
            </div>
          </div>
        </div>

        <div className="relative -mt-[480px] md:-mt-[460px] lg:-mt-[470px] z-20 px-3 md:px-8">
          <div className="max-w-[1360px] mx-auto grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4 items-end">
            {products.map((p, i) => (
              <div
                key={`${p.title}-bottle`}
                className="relative w-full aspect-1/3 flex items-end justify-center drop-shadow-[0_22px_32px_rgba(15,31,54,0.32)]"
                style={{ zIndex: 10 - i }}
              >
                <Image
                  src={p.img}
                  alt={`${p.name} ${p.variant.replace(/\n/g, " ")}`}
                  fill
                  sizes="(min-width: 1024px) 16vw, (min-width: 768px) 20vw, 30vw"
                  className="object-contain object-bottom"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative bg-[#FAF5E8] pt-6 pb-20 md:pb-24 px-3 md:px-8">
        <div className="max-w-[1360px] mx-auto grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
          {products.map((p) => (
            <article
              key={`${p.title}-info`}
              className="flex flex-col items-center text-center px-2"
            >
              <p className="font-serif text-[13px] md:text-[14px] tracking-[0.28em] text-[#0B1A2E] font-medium">
                {p.name}
              </p>
              <p className="text-[10px] md:text-[10.5px] tracking-[0.22em] text-[#0B1A2E]/85 mt-1 leading-[1.5] whitespace-pre-line">
                {p.variant}
              </p>

              <div className="mt-3 inline-block bg-white text-[#0B1A2E] text-[10px] tracking-[0.2em] px-3 py-1 border border-[#0B1A2E]/15 font-medium">
                {p.smv}
              </div>

              <p className="mt-4 text-[12.5px] md:text-[13px] font-semibold text-[#0B1A2E] tracking-[0.02em]">
                {p.title}
              </p>
              <p className="mt-2 text-[11px] md:text-[11.5px] leading-[1.65] text-ink/65 whitespace-pre-line">
                {p.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
