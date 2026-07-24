/**
 * 文字分割ヘルパー（Server Component 対応の純粋関数）。
 *
 * GSAP の SplitText は i18n の display:none 側で誤計測するため使わず、
 * サーバー側で最初から <span> に分割してレンダリングする。
 * アニメーションは StoriesFx が className を対象に行う。
 */

/** 一文字ずつ <span> に割る（日本語タイトル用） */
export function Chars({ text, className }: { text: string; className: string }) {
  return (
    <>
      {[...text].map((c, i) => (
        <span key={`${c}-${i}`} className={`${className} inline-block`}>
          {c === " " ? " " : c}
        </span>
      ))}
    </>
  );
}

/** 単語ごとにマスク付きで割る（英字タイトルのせり上げ用） */
export function Words({
  text,
  className,
  masked = false,
}: {
  text: string;
  className: string;
  /** true なら overflow-hidden のマスクで包む（下からのせり上げが行内で切れる） */
  masked?: boolean;
}) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => {
        const spacing = i < words.length - 1 ? "mr-[0.26em]" : "";
        if (!masked) {
          return (
            <span
              key={`${w}-${i}`}
              className={`${className} inline-block ${spacing}`}
            >
              {w}
            </span>
          );
        }
        return (
          <span
            key={`${w}-${i}`}
            className={`inline-block overflow-hidden align-top ${spacing}`}
          >
            <span className={`${className} inline-block`}>{w}</span>
          </span>
        );
      })}
    </>
  );
}
