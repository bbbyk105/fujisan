"use client";

import { useReveal } from "@/hooks/useReveal";

const specs = [
  { key: "Classification", val: "Junmai Daiginjo 純米大吟醸" },
  { key: "Origin", val: "Mt. Fuji, Shizuoka, Japan" },
  { key: "Terroir", val: "Tanuki Lake, Alpine Water" },
  { key: "Alcohol", val: "15% vol" },
  { key: "Hoshisora", val: "720ml · Gold & Blue Editions" },
  { key: "Bushido", val: "300ml · 7 Designs A–G" },
  { key: "Tasting Notes", val: "Crystalline clarity · Structured depth · Long finish" },
  { key: "Service", val: "8–12°C · Chilled, crystal glass" },
];

export default function Specs() {
  const ref = useReveal<HTMLElement>();

  return (
    <section className="bg-off-white py-[clamp(64px,8vw,100px)]" id="terroir" ref={ref}>
      <div className="max-w-[1240px] mx-auto px-[clamp(24px,5vw,60px)]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(48px,7vw,100px)] items-start">
          <div>
            <p className="reveal text-[10px] tracking-[5px] uppercase text-gold-dark font-normal mb-[18px]">
              Specifications
            </p>
            <div className="reveal d1 w-[52px] h-px bg-gold-dark mb-9" />
            <h2 className="reveal d1 font-serif text-[clamp(32px,4vw,48px)] font-light leading-[1.05] mb-7 text-ink">
              <em className="italic text-gold-dark">Craft</em> &amp;<br />Detail
            </h2>
            <p className="reveal d2 text-[clamp(15px,2vw,17px)] leading-[1.85] text-ink/60 max-w-[540px]">
              Every element — from the rice polishing ratio to the bottle silhouette —
              is chosen with obsessive attention. The result is sake that speaks for itself.
            </p>
          </div>

          <div className="reveal d2">
            <table className="w-full border-collapse">
              <tbody>
                {specs.map((spec, i) => (
                  <tr
                    key={spec.key}
                    className={i < specs.length - 1 ? "border-b border-ink/10" : ""}
                  >
                    <td className="py-4 text-[10px] tracking-[3px] uppercase text-ink/42 w-[42%] font-normal align-top font-serif">
                      {spec.key}
                    </td>
                    <td className="py-4 text-[clamp(14px,1.6vw,17px)] font-light text-ink italic font-serif">
                      {spec.val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
