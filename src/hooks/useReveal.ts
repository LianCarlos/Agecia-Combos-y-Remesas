"use client";

import { useEffect, useRef, useState } from "react";

interface RevealOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * Revela un elemento la primera vez que entra en el viewport.
 * Si IntersectionObserver no está disponible (SSR / navegadores viejos),
 * el elemento se marca visible de inmediato para no quedar oculto.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: RevealOptions) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          setVisible(entry.isIntersecting);
        }
      },
      {
        threshold: options?.threshold ?? 0.08,
        rootMargin: options?.rootMargin ?? "0px 0px -6% 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options?.threshold, options?.rootMargin]);

  return { ref, visible };
}
