type Props = {
  variant?: "line" | "fill";
  className?: string;
};

/**
 * 富士の稜線 — ブランドのシグネチャーモチーフ。
 * ヒーロー背景写真の稜線を抽出した一本のラインを、
 * セクション区切り（line）とダーク面の透かし（fill）として全ページに通す。
 * 山頂の火口（中央のわずかな切り欠き）が富士であることの記名。
 */
export function FujisanRidge({ variant = "line", className = "" }: Props) {
  const ridge =
    "M0 96 C220 92 430 78 560 50 C615 38 655 26 688 22 L706 25 L720 17 L736 24 L752 21 C788 26 836 40 896 56 C1024 86 1230 94 1440 97";

  return (
    <svg
      viewBox="0 0 1440 110"
      preserveAspectRatio="none"
      aria-hidden
      fill="none"
      className={className}
    >
      {variant === "fill" ? (
        <path d={`${ridge} L1440 110 L0 110 Z`} fill="currentColor" />
      ) : (
        <path
          d={ridge}
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
