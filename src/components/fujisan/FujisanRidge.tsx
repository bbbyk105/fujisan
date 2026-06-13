type Props = {
  variant?: "line" | "fill";
  /** 冠雪線を描くか（line variant のみ） */
  snowcap?: boolean;
  className?: string;
};

/**
 * 富士の稜線 — ブランドのシグネチャーモチーフ。
 * 特徴は「末広がりの凹型スロープ（裾野に向かって反り返る）」「幅広く
 * わずかに серрレートした山頂」「冠雪線」。この3点で富士と分かる。
 * 左右対称（中心 x=720）。両端は裾野として水平に消える。
 */

// 裾野 → 凹型スロープ → 幅広い山頂 → 凹型スロープ → 裾野（左右対称）
const RIDGE =
  "M0 200 C170 198 330 194 450 186 C570 178 628 122 648 66 " +
  "L672 60 L692 64 L706 57 L720 60 L734 56 L748 63 L772 60 L792 66 " +
  "C812 122 870 178 990 186 C1110 194 1270 198 1440 200";

// 冠雪線 — 山頂直下の雪冠の裾。中央がやや下がる緩い波。
const SNOWLINE = "M604 108 C660 122 780 122 836 108";

export function FujisanRidge({
  variant = "line",
  snowcap = true,
  className = "",
}: Props) {
  return (
    <svg
      viewBox="0 0 1440 240"
      preserveAspectRatio="none"
      aria-hidden
      fill="none"
      className={className}
    >
      {variant === "fill" ? (
        <path d={`${RIDGE} L1440 240 L0 240 Z`} fill="currentColor" />
      ) : (
        <>
          <path
            d={RIDGE}
            stroke="currentColor"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {snowcap ? (
            <path
              d={SNOWLINE}
              stroke="currentColor"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              opacity="0.6"
            />
          ) : null}
        </>
      )}
    </svg>
  );
}
