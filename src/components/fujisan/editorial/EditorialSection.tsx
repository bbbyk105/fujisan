import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";

type Width = "default" | "narrow" | "wide";

const widthCls: Record<Width, string> = {
  default: "",
  narrow: "ed-wrap-narrow",
  wide: "ed-wrap-wide",
};

/**
 * 章。区切りは背景色の塗り分けではなく上の罫でつける。
 * 塗り分けを重ねると帯が積み上がって「テンプレ感」が出る。
 */
export function EditorialSection({
  id,
  children,
  width = "default",
  ruled = true,
  tone = "light",
  className = "",
}: {
  id?: string;
  children: ReactNode;
  width?: Width;
  /** 上に罫を引くか。ページ最初の章では false */
  ruled?: boolean;
  /** dark にすると .ed-* の配色がそのまま反転する */
  tone?: "light" | "dark";
  className?: string;
}) {
  const isDark = tone === "dark";

  return (
    <section
      id={id}
      data-tone={isDark ? "dark" : undefined}
      className={`ed-section ${ruled && !isDark ? "ed-section-ruled" : ""} ${
        isDark ? "bg-indigo" : ""
      } ${className}`}
    >
      <div className={`ed-wrap ${widthCls[width]}`}>{children}</div>
    </section>
  );
}

/**
 * 章の見出し。番号は「順番に意味があるとき」だけ渡す。
 * 飾りの通し番号（Ⅸ.Ⅱ.iii のような）は付けない。
 */
export function EditorialSectionHead({
  label,
  heading,
  lead,
  index,
  className = "",
}: {
  label?: ReactNode;
  heading: ReactNode;
  lead?: ReactNode;
  index?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {(label || index) && (
        <Reveal as="p" className="ed-label flex items-baseline gap-3">
          {index ? <span className="ed-num">{index}</span> : null}
          {label}
        </Reveal>
      )}
      <Reveal
        as="h2"
        className={`ed-h2 ${label || index ? "mt-4" : ""}`}
        delay={revealDelays.d1}
      >
        {heading}
      </Reveal>
      {lead ? (
        <Reveal as="p" className="ed-p mt-5" delay={revealDelays.d2}>
          {lead}
        </Reveal>
      ) : null}
    </div>
  );
}
