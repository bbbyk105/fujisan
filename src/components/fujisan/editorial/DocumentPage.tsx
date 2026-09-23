import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";
import { EditorialPage } from "./EditorialPage";
import { EditorialPageHeader } from "./EditorialPageHeader";
import { L } from "@/i18n/Localized";

export type DocumentSection = {
  /** 条番号。索引と本文で同じものを使う */
  num?: string;
  heading: ReactNode;
  /** 索引に出す短い名前。見出しが長い場合だけ指定する */
  short?: ReactNode;
  body: ReactNode[];
  bullets?: ReactNode[];
};

type Props = {
  kicker?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  updated?: string;
  sections: DocumentSection[];
};

/**
 * 規約・ポリシーなど「読み物としての文書」のページ。
 *
 * 条ごとに写真や囲みを足さない。読み手が探しているのは特定の一条なので、
 * 番号・見出し・索引の 3 つだけを頼りに走査できる状態を保つ。
 */
export default function DocumentPage({
  kicker,
  title,
  lead,
  updated,
  sections,
}: Props) {
  const numberOf = (s: DocumentSection, i: number) =>
    s.num ?? String(i + 1).padStart(2, "0");

  return (
    <EditorialPage>
      <EditorialPageHeader
        kicker={kicker}
        title={title}
        lead={lead}
        meta={
          updated ? (
            <L en={`Last updated ${updated}`} ja={`最終更新 ${updated}`} />
          ) : undefined
        }
      />

      <div className="ed-wrap pb-24 pt-14 md:pb-32 md:pt-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[168px_minmax(0,1fr)] md:gap-16 lg:gap-24">
          {/* 索引 — 長い文書でだけ意味がある。画面が狭いときは畳む */}
          <aside className="hidden md:block">
            <nav
              aria-label="このページの目次"
              className="ed-index sticky top-[112px]"
            >
              {sections.map((s, i) => (
                <a key={i} href={`#s-${numberOf(s, i)}`}>
                  <span className="ed-num mr-3">{numberOf(s, i)}</span>
                  {s.short ?? s.heading}
                </a>
              ))}
            </nav>
          </aside>

          <article className="max-w-[40em]">
            {sections.map((s, i) => {
              const num = numberOf(s, i);
              return (
                <Reveal
                  key={i}
                  as="section"
                  id={`s-${num}`}
                  delay={revealDelays.d1}
                  className="scroll-mt-[112px] border-t border-[var(--ed-rule)] pt-11 first:border-t-0 first:pt-0 [&+&]:mt-14"
                >
                  <div className="flex items-baseline gap-5">
                    <span className="ed-num">{num}</span>
                    <h2 className="ed-h2">{s.heading}</h2>
                  </div>

                  <div className="mt-6 md:pl-[52px]">
                    {s.body.map((p, k) => (
                      <p key={k} className="ed-p">
                        {p}
                      </p>
                    ))}

                    {s.bullets && s.bullets.length > 0 ? (
                      <ul className="ed-list mt-6">
                        {s.bullets.map((b, k) => (
                          <li key={k}>{b}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </Reveal>
              );
            })}
          </article>
        </div>
      </div>
    </EditorialPage>
  );
}
