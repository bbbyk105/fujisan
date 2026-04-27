"use client";

import Image from "next/image";
import { ViewTransition } from "react";

type Props = {
  slug: string;
  src: string;
  alt: string;
};

export function ProductHeroBottle({ slug, src, alt }: Props) {
  return (
    <div className="fujisan-bottle-drop relative h-full w-[92%]">
      <div className="fujisan-bottle relative h-full w-full">
        <ViewTransition name={`bottle-${slug}`} share="morph">
          <Image
            src={src}
            alt={alt}
            fill
            priority
            fetchPriority="high"
            sizes="(min-width: 1024px) 38vw, (min-width: 768px) 50vw, 92vw"
            className="object-contain object-bottom"
          />
        </ViewTransition>
      </div>
    </div>
  );
}
