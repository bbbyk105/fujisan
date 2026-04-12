"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ParallaxState {
  progress: number;   // 0 = just entered bottom, 1 = just left top
  isInView: boolean;
}

export function useParallax<T extends HTMLElement = HTMLElement>(
  speed: number = 0.3
) {
  const ref = useRef<T>(null);
  const [state, setState] = useState<ParallaxState>({
    progress: 0,
    isInView: false,
  });

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const windowH = window.innerHeight;

    const isInView = rect.bottom > 0 && rect.top < windowH;
    const progress = Math.min(
      1,
      Math.max(0, (windowH - rect.top) / (windowH + rect.height))
    );

    setState({ progress, isInView });
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [handleScroll]);

  const translateY = (state.progress - 0.5) * speed * 100;
  const scale = 1 + state.progress * speed * 0.15;

  return { ref, ...state, translateY, scale };
}
