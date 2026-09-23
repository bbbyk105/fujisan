import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";

/** ラベルと値を罫だけで仕切る表。連絡先・仕様・明細はすべてこれで組む */
export function EdDataList({
  rows,
  className = "",
}: {
  rows: { label: ReactNode; value: ReactNode }[];
  className?: string;
}) {
  return (
    <dl className={`ed-dl ${className}`}>
      {rows.map((row, i) => (
        <div key={i}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * 順番に意味がある手順。番号は本文の外にぶら下げる。
 * 「01 / 02 / 03」を横に 3 つ並べたカードにはしない。
 */
export function EdSteps({
  steps,
  className = "",
}: {
  steps: { heading: ReactNode; body: ReactNode }[];
  className?: string;
}) {
  return (
    <ol className={`ed-steps ${className}`}>
      {steps.map((s, i) => (
        <Reveal as="li" key={i} delay={revealDelays.d1 + i * 0.06}>
          <span className="ed-num">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <h3 className="ed-h3">{s.heading}</h3>
            <p className="ed-p mt-2.5">{s.body}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}

/** 開閉する問答。閉じているものは 1 行の罫にしか見えないのが正しい */
export function EdFaq({
  items,
  className = "",
  numbered = false,
}: {
  items: { q: ReactNode; a: ReactNode }[];
  className?: string;
  numbered?: boolean;
}) {
  return (
    <div className={`ed-faq ${className}`}>
      {items.map((item, i) => (
        <details key={i}>
          <summary>
            {numbered ? (
              <span className="ed-num shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
            ) : null}
            <span className="ed-h3">{item.q}</span>
            <span aria-hidden className="ed-faq-mark" />
          </summary>
          <div className={`pb-7 ${numbered ? "md:pl-[52px]" : ""}`}>
            <p className="ed-p">{item.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

/** 注意書き。囲み枠を作らず、左の罫だけで本文と区別する */
export function EdNote({
  label,
  children,
  className = "",
  ...rest
}: {
  label?: ReactNode;
  children: ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`ed-note ${className}`} {...rest}>
      {label ? <p className="ed-label">{label}</p> : null}
      <div className={label ? "mt-2.5" : ""}>{children}</div>
    </div>
  );
}

/**
 * ページ下端の行き先。ボタンを 2 つ並べるのではなく、
 * 主たる行き先ひとつと、控えめなリンクひとつにする。
 */
export function EdActions({
  primary,
  secondary,
  className = "",
}: {
  primary?: { href: string; label: ReactNode };
  secondary?: { href: string; label: ReactNode };
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-10 gap-y-5 ${className}`}>
      {primary ? (
        <Link href={primary.href} className="ed-btn">
          {primary.label}
        </Link>
      ) : null}
      {secondary ? (
        <Link href={secondary.href} className="ed-link text-[13px]">
          {secondary.label}
        </Link>
      ) : null}
    </div>
  );
}
