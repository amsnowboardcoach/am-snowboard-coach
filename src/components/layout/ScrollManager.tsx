"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { scrollToId, scrollToTop } from "@/lib/navigation/scroll";

/**
 * Al cambiar de ruta, sube al inicio con scroll suave.
 * Si la URL lleva hash (#sección), desplaza a ese elemento.
 */
export function ScrollManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    const path = `${pathname}?${searchParams.toString()}`;
    const hash =
      typeof window !== "undefined" ? window.location.hash.slice(1) : "";

    if (prevPath.current === null) {
      prevPath.current = path;
      if (hash) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => scrollToId(hash, { block: "start" }));
        });
      }
      return;
    }

    if (prevPath.current === path) return;
    prevPath.current = path;

    if (hash) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToId(hash, { block: "start" }));
      });
      return;
    }

    scrollToTop();
  }, [pathname, searchParams]);

  return null;
}
