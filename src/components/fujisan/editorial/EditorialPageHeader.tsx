import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal/Reveal";
import { revealDelays } from "@/components/reveal/constants";

type Props = {
  /** ページ名。<L> で日英どちらか一方だけが出る */
  title: ReactNode;
  /** 1〜2 文の導入。無理に付けない */
  lead?: ReactNode;
  /** 罫の右端に置く補足（最終更新日など） */
  meta?: ReactNode;
  /** 版面の幅。**本文の章と必ず揃えること**（左端がずれると素人の版面になる） */
  width?: "default" | "narrow" | "wide";
};

const widthCls = {
  default: "",
  narrow: "ed-wrap-narrow",
  wide: "ed-wrap-wide",
} as const;

/**
 * 対象ページ共通の扉。
 *
 * 写真も章番号も見出しの上のラベルも置かない。名前・導入・罫だけで、
 * どのページも同じ高さから始まるようにする。商品ページの
 * `FujisanInnerHero`（写真ヒーロー）とは役割が違うので混ぜないこと。
 */
export function EditorialPageHeader({
  title,
  lead,
  meta,
  width = "default",
}: Props) {
  return (
    <header className="pt-[72px] md:pt-[86px]">
      {/* 下の余白は置かない。扉の終わりは罫で、そこから先の間隔は
          各章の padding が持つ（同じ間隔がページをまたいで揃う） */}
      <div className={`ed-wrap pt-14 md:pt-24 ${widthCls[width]}`}>
        <Reveal as="h1" className="ed-title">
          {title}
        </Reveal>

        {lead ? (
          <Reveal as="p" className="ed-lead mt-7" delay={revealDelays.d2}>
            {lead}
          </Reveal>
        ) : null}

        {/* 罫は見出しの下敷きではなく、扉と本文を分ける境目。
            補足はその罫の上に乗せる */}
        <Reveal
          className="mt-12 flex items-end gap-8 md:mt-16"
          delay={revealDelays.d3}
        >
          <span aria-hidden className="ed-rule ed-rule-strong flex-1" />
          {meta ? <span className="ed-small shrink-0">{meta}</span> : null}
        </Reveal>
      </div>
    </header>
  );
}
