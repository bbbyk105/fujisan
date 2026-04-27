import Image from "next/image";
import Link from "next/link";
import FujisanNav from "@/components/fujisan/FujisanNav";
import FujisanFooter from "@/components/fujisan/FujisanFooter";
import { FujisanInnerHero } from "@/components/fujisan/FujisanInnerHero";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";

export const metadata = {
  title: "Pairings — FUJISAN SAKE",
  description:
    "Curated food and sake pairings — sashimi, tempura, yakitori, and aged cheese, matched to the Fujisan collection.",
};

const pairings = [
  {
    roman: "Ⅰ",
    name: "SASHIMI",
    jp: "刺身",
    palette: "Cool · Mineral · Quiet",
    desc: "Raw fish at its purest needs a sake that disappears under it. We pour the Junmai Daiginjo Aroma well-chilled, in a tulip glass, so the white-peach perfume drifts up between bites.",
    sake: "Junmai Daiginjo — Aroma",
    sakeSlug: "daiginjo-aroma",
    serve: "Chilled · 8°C",
    image: "/images/fujisan/pairings/sashimi.png",
  },
  {
    roman: "Ⅱ",
    name: "TEMPURA",
    jp: "天ぷら",
    palette: "Crisp · Light · Refreshing",
    desc: "Hot, fragile batter wants a sake that resets the palate. The Tokubetsu Junmai — Bold cuts cleanly through the oil with a brisk acidity, leaving the prawn or aubergine alone on the tongue.",
    sake: "Tokubetsu Junmai — Bold",
    sakeSlug: "junmai-bold",
    serve: "Ice-cold · 5–8°C",
    image: "/images/fujisan/pairings/tempra.png",
  },
  {
    roman: "Ⅲ",
    name: "YAKITORI",
    jp: "焼き鳥",
    palette: "Warm · Savory · Round",
    desc: "Charred skin, tare glaze, smoky char — yakitori asks for a sake with a low, mellow voice. Tokubetsu Junmai answers, lightly warmed, deepening the umami of the chicken without overpowering it.",
    sake: "Tokubetsu Junmai",
    sakeSlug: "junmai",
    serve: "Warm · 40°C",
    image: "/images/fujisan/pairings/yakitori.png",
  },
  {
    roman: "Ⅳ",
    name: "AGED CHEESE",
    jp: "熟成チーズ",
    palette: "Rich · Long · Surprising",
    desc: "Pecorino, hard goat, aged Comté — the salt and the fat call for the Reserve Daiginjo. Its slow umami and faint oak warmth meet the cheese the way miso meets butter, on equal terms.",
    sake: "Junmai Daiginjo — Reserve",
    sakeSlug: "daiginjo-rich",
    serve: "Chilled · 10°C",
    image: "/images/fujisan/pairings/cheese.png",
  },
];

const principles = [
  {
    num: "Ⅰ",
    title: "Match the weight",
    jp: "重さを合わせる",
    desc: "Light dishes ask for ginjo and daiginjo. Richer plates welcome junmai and honjozo with deeper umami.",
  },
  {
    num: "Ⅱ",
    title: "Let the temperature steer",
    jp: "温度で導く",
    desc: "Chilled lifts aroma and crispness; lightly warm rounds out body and texture. The same bottle changes voice across the range.",
  },
  {
    num: "Ⅲ",
    title: "Taste the silence",
    jp: "余韻を聴く",
    desc: "After each pairing, take a small breath. The right match leaves the room quieter, not louder.",
  },
];

export default function PairingsPage() {
  return (
    <main className="bg-[#FAF5E8] text-[#0B1A2E] min-h-screen">
      <FujisanNav />

      <FujisanInnerHero
        eyebrow="HARMONY · PAIRINGS"
        chapter="Ⅲ"
        title="PERFECT PAIRINGS"
        jp="― 食卓の調和 ―"
        lead="Sake is not a soloist. It is the second voice that makes the food clearer. These four pairings are how our brewers serve their own table."
        crumbs={[
          { label: "HOME", href: "/#top" },
          { label: "PAIRINGS", href: "/pairings" },
        ]}
        bgPosition="object-[50%_50%]"
      />

      {/* ===== Pairing list ===== */}
      <section className="relative bg-[#FAF5E8]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#0B1A2E]/15 to-transparent"
        />
        <div className="mx-auto max-w-[1280px] px-7 py-20 md:px-12 md:py-24">
          <div className="flex flex-col gap-20 md:gap-24">
            {pairings.map((p, i) => {
              const flip = i % 2 === 1;
              return (
                <Reveal
                  key={p.name}
                  delay={0.05}
                  className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center md:gap-14"
                >
                  <div
                    className={`relative aspect-[5/4] overflow-hidden ${
                      flip ? "md:order-2" : ""
                    }`}
                  >
                    <Image
                      src={p.image}
                      alt={p.name.toLowerCase()}
                      fill
                      sizes="(min-width: 768px) 50vw, 92vw"
                      className="object-cover"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0B1A2E]/22 via-transparent to-transparent"
                    />
                    <span className="absolute left-4 top-4 font-serif text-[12px] font-medium tracking-[0.32em] text-[#FAF5E8]">
                      {p.roman}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10.5px] font-semibold tracking-[0.34em] text-[#C9A84C]">
                      {p.palette.toUpperCase()}
                    </p>
                    <h2 className="mt-4 font-serif text-[clamp(28px,3.4vw,42px)] font-semibold leading-[1.05] tracking-[0.04em] text-[#0B1A2E]">
                      {p.name}
                    </h2>
                    <p className="mt-2 font-jp text-[13px] tracking-[0.28em] text-[#C9A84C]/85">
                      {p.jp}
                    </p>

                    <p className="mt-7 max-w-[520px] text-[14px] font-light leading-[1.85] text-[#1D2432]/82 md:text-[15px]">
                      {p.desc}
                    </p>

                    <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[#0B1A2E]/12 pt-6 text-left sm:max-w-[440px]">
                      <div>
                        <dt className="text-[10px] font-semibold tracking-[0.26em] text-[#0B1A2E]/55">
                          PAIR WITH
                        </dt>
                        <dd className="mt-1.5 font-serif text-[15px] text-[#0B1A2E]">
                          {p.sake}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold tracking-[0.26em] text-[#0B1A2E]/55">
                          SERVE
                        </dt>
                        <dd className="mt-1.5 font-serif text-[15px] text-[#0B1A2E]">
                          {p.serve}
                        </dd>
                      </div>
                    </dl>

                    <Link
                      href={`/products/${p.sakeSlug}`}
                      className="group/link mt-9 inline-flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.34em] text-[#0B1A2E] no-underline"
                    >
                      <span className="relative pb-1">
                        EXPLORE THE BOTTLE
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
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Three principles ===== */}
      <section className="relative bg-[#0F1D30] text-[#F2E4C7]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#D7B46A]/40 to-transparent"
        />
        <div className="mx-auto max-w-[1280px] px-7 py-20 md:px-12 md:py-24">
          <Reveal className="flex items-center gap-3">
            <span className="font-serif text-[11px] font-medium tracking-[0.32em] text-[#D7B46A]">
              Ⅲ.II
            </span>
            <span className="h-px w-10 bg-[#D7B46A]/55" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#D7B46A]/85">
              Three Principles
            </span>
          </Reveal>

          <Reveal
            as="h2"
            className="mt-5 max-w-[680px] font-serif text-[clamp(24px,2.6vw,34px)] font-semibold leading-[1.15] tracking-[0.06em] text-[#F2E4C7]"
            delay={revealDelays.d1}
          >
            How our brewers think about pairing.
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-y-10 md:grid-cols-3 md:gap-x-10">
            {principles.map((p, i) => (
              <Reveal
                key={p.title}
                delay={0.12 + i * 0.1}
                className="relative flex flex-col gap-4 border-t border-[#D7B46A]/30 pt-6"
              >
                <span
                  aria-hidden
                  className="absolute -top-[1px] left-0 h-px w-12 bg-[#D7B46A]"
                />
                <span className="font-serif text-[12px] font-medium tracking-[0.34em] text-[#D7B46A]">
                  {p.num}
                </span>
                <div>
                  <h3 className="font-serif text-[16px] font-semibold tracking-[0.16em] text-[#F2E4C7]">
                    {p.title.toUpperCase()}
                  </h3>
                  <p className="mt-1 font-jp text-[11px] tracking-[0.24em] text-[#D7B46A]/85">
                    {p.jp}
                  </p>
                </div>
                <p className="text-[13px] font-light leading-[1.78] text-[#F2E4C7]/76">
                  {p.desc}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <FujisanFooter />
    </main>
  );
}
