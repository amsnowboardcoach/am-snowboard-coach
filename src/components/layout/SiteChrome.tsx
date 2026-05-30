"use client";

import { Suspense } from "react";
import { FloatingWhatsAppButton } from "@/components/contact/FloatingWhatsAppButton";
import { ScrollManager } from "@/components/layout/ScrollManager";
import { ScrollToTopButton } from "@/components/layout/ScrollToTopButton";

interface SiteChromeProps {
  showScrollTop?: boolean;
  /** Barra inferior móvil en sitio público */
  aboveMobileNav?: boolean;
}

export function SiteChrome({
  showScrollTop = true,
  aboveMobileNav = false,
}: SiteChromeProps) {
  return (
    <>
      <Suspense fallback={null}>
        <ScrollManager />
      </Suspense>
      <FloatingWhatsAppButton aboveMobileNav={aboveMobileNav} />
      {showScrollTop && (
        <ScrollToTopButton aboveMobileNav={aboveMobileNav} />
      )}
    </>
  );
}
