import Link from "next/link";
import { L } from "@/i18n/Localized";

/**
 * 巻末（結）— 夜の藍にひと筋の金で巻を閉じる。
 * Server Component — マークアップのみ（演出は StoriesFx）。
 */
export function StoriesClosing() {
  return (
    <section className="stories-closing fujisan-dark-glow relative overflow-hidden bg-[#0F1D30] text-[#F2E4C7]">
      <div
        aria-hidden
        className="closing-bg-drift pointer-events-none absolute inset-x-0 top-0 h-[200%] opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(215,180,106,0.10) 0%, rgba(15,29,48,0) 35%, rgba(15,29,48,0) 65%, rgba(215,180,106,0.10) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#D7B46A]/40 to-transparent"
      />

      <div className="relative z-10 mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-12 px-7 py-24 md:flex-row md:items-end md:px-12 md:py-32">
        <div className="max-w-[600px]">
          <div className="closing-eyebrow flex items-center gap-4">
            <span className="font-serif text-[12px] tracking-[0.3em] text-[#D7B46A]">
              結
            </span>
            <span className="h-px w-10 bg-[#D7B46A]/50" />
            <span className="font-jp text-[11.5px] tracking-[0.3em] text-[#F2E4C7]/70">
              <L en="THE LAST POUR" ja="今宵の一本" />
            </span>
          </div>
          <h2 className="closing-title mt-6 font-serif text-[clamp(28px,3.4vw,46px)] font-semibold leading-[1.14] tracking-[0.04em] text-[#F2E4C7]">
            <L en="Find the bottle for tonight." ja="今宵の一本を、選ぶ。" />
          </h2>
          <span
            aria-hidden
            className="closing-underline mt-5 block h-px w-32 bg-linear-to-r from-[#D7B46A] to-transparent"
          />
          <p className="closing-lead mt-7 max-w-[520px] text-[13.5px] leading-[2.0] text-[#F2E4C7]/78">
            <L
              en="Five labels, each with its own character — from crisp and dry to round and slightly sweet. Pick the one that fits the evening."
              ja="五つの銘柄、それぞれに個性があります。きりりと辛口のものから、ふくよかでやや甘口のものまで。今宵に合う一本をどうぞ。"
            />
          </p>
        </div>

        <Link
          href="/shop/personal"
          className="closing-cta group/link relative inline-flex items-center gap-3 border border-[#D7B46A]/35 bg-[#D7B46A]/[0.06] px-8 py-5 text-[10.5px] font-semibold tracking-[0.34em] text-[#F2E4C7] no-underline transition-colors hover:border-[#D7B46A] hover:bg-[#D7B46A]/12"
        >
          <span className="relative">
            <L en="VIEW THE COLLECTION" ja="コレクションを見る" />
          </span>
          <span
            aria-hidden
            className="transition-transform duration-500 group-hover/link:translate-x-1 group-hover/link:text-[#D7B46A]"
          >
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
