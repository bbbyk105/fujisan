const CHARS = "FUJISAN".split("");

/**
 * ヒーローの FUJISAN 見出し。Server Component — マークアップのみ。
 * スクロールに応じて 1 文字ずつ稜線の輪郭を描いて持ち上がる演出
 * （シグネチャー = 稜線をタイポグラフィでも反復する）は FujisanHeroFx が担う。
 */
export function KineticFujisanTitle() {
  return (
    <span
      role="text"
      aria-label="FUJISAN"
      className="kinetic-title fujisan-rise-lcp mt-4 block font-serif text-[clamp(66px,10vw,150px)] font-semibold leading-[0.9] tracking-[0.04em]"
      style={{ animationDelay: "420ms" }}
    >
      {CHARS.map((c, i) => (
        <span key={i} aria-hidden className="kinetic-char inline-block">
          {c}
        </span>
      ))}
    </span>
  );
}
