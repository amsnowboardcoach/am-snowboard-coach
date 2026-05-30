"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { scrollToTop } from "@/lib/navigation/scroll";

type SiteLinkProps = ComponentProps<typeof Link> & {
  /** Scroll suave al inicio al navegar (por defecto true en rutas internas) */
  scrollTop?: boolean;
};

/**
 * Enlace interno con scroll al inicio al pulsar (complementa ScrollManager en cambios de ruta).
 */
export function SiteLink({
  scrollTop = true,
  onClick,
  href,
  ...props
}: SiteLinkProps) {
  const hrefStr = typeof href === "string" ? href : (href.pathname ?? "");

  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || !scrollTop) return;
        const isHashOnly =
          typeof hrefStr === "string" &&
          (hrefStr.startsWith("#") ||
            (hrefStr.includes("#") && !hrefStr.replace(/#.*$/, "")));
        if (!isHashOnly) {
          scrollToTop();
        }
      }}
      {...props}
    />
  );
}
