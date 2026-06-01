"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { FloatingWhatsAppButton } from "@/components/contact/FloatingWhatsAppButton";
import { ScrollManager } from "@/components/layout/ScrollManager";
import { ScrollToTopButton } from "@/components/layout/ScrollToTopButton";

interface SiteChromeProps {
  showScrollTop?: boolean;
  /** Barra inferior móvil en sitio público */
  aboveMobileNav?: boolean;
}

function SiteChromeInner({
  showScrollTop = true,
  aboveMobileNav = false,
}: SiteChromeProps) {
  const pathname = usePathname() ?? "";
  const isCoachPanel =
    pathname === "/coach" || pathname.startsWith("/coach/");

  return (
    <>
      <Suspense fallback={null}>
        <ScrollManager />
      </Suspense>
      {!isCoachPanel && (
        <FloatingWhatsAppButton aboveMobileNav={aboveMobileNav} />
      )}
      {showScrollTop && (
        <ScrollToTopButton aboveMobileNav={aboveMobileNav} />
      )}
    </>
  );
}

export function SiteChrome(props: SiteChromeProps) {
  return (
    <Suspense fallback={null}>
      <SiteChromeInner {...props} />
    </Suspense>
  );
}
