"use client";

import { useReveal } from "@/hooks/useReveal";

export default function Philosophy() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="bg-ink2 py-[clamp(64px,8vw,100px)] text-center border-t border-b border-gold/12"
    >
      <div className="max-w-[860px] mx-auto px-[clamp(24px,5vw,60px)]">
        <p className="reveal font-serif text-[clamp(22px,3.5vw,44px)] font-light italic leading-[1.4] text-gold-lt mb-7">
          &ldquo;Not a sake of battle, but of self-mastery and inner resolve.&rdquo;
        </p>
        <p className="reveal d1 text-[13px] tracking-[4px] uppercase text-silver">
          The Bushido Code — 武士道
        </p>
        <p className="reveal d2 font-jp text-[16px] font-light tracking-[6px] text-off-white/45 mt-6">
          義　勇　仁　礼　誠　名誉　忠義
        </p>
      </div>
    </div>
  );
}
