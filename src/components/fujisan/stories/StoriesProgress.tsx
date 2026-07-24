type Props = {
  /** 各章を象徴する漢字（寒・米・水…）。数がそのまま章数になる。 */
  marks: string[];
};

/**
 * 上端の進捗バー（金色1pxライン）と右側の章インデックス。
 * Server Component — マークアップと CSS のみ。
 * 進捗バーの scrub 追従と .is-active の付け外しは StoriesFx が行う。
 */
export function StoriesProgress({ marks }: Props) {
  return (
    <div aria-hidden>
      {/* top progress bar */}
      <div className="progress-rail pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] bg-[#0B1A2E]/8">
        <div className="progress-fill h-full w-full origin-left scale-x-0 bg-linear-to-r from-[#C9A84C] via-[#E2C97E] to-[#C9A84C]" />
      </div>

      {/* right-side chapter kanji index */}
      <div className="chapter-index pointer-events-none fixed right-5 top-1/2 z-50 hidden -translate-y-1/2 flex-col items-center gap-4 xl:flex">
        {marks.map((kanji, i) => (
          <span
            key={`${kanji}-${i}`}
            className="chapter-dot flex flex-col items-center gap-[6px]"
          >
            <span className="dot-kanji font-serif text-[13px] leading-none text-[#0B1A2E]/25 transition-all duration-500">
              {kanji}
            </span>
            <span className="dot-tick h-[10px] w-px bg-[#0B1A2E]/15 transition-all duration-500" />
          </span>
        ))}
      </div>

      <style>{`
        .dot-kanji {
          text-shadow: 0 0 10px rgba(250, 245, 232, 0.9);
        }
        .chapter-dot.is-active .dot-kanji {
          color: rgba(11, 26, 46, 0.92);
          transform: scale(1.3);
        }
        .chapter-dot.is-active .dot-tick {
          background: #C9A84C;
          height: 18px;
        }
        .chapter-dot:last-child .dot-tick {
          display: none;
        }
      `}</style>
    </div>
  );
}
