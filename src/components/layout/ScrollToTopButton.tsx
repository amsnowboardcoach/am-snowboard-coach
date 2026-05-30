"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { scrollToTop } from "@/lib/navigation/scroll";

interface ScrollToTopButtonProps {
  /** En sitio público hay barra inferior en móvil */
  aboveMobileNav?: boolean;
  className?: string;
}

export function ScrollToTopButton({
  aboveMobileNav = false,
  className,
}: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => scrollToTop()}
      aria-label="Volver arriba"
      className={cn(
        "fixed z-50 flex size-12 items-center justify-center rounded-full border border-zinc-700/90 bg-zinc-900/95 text-zinc-200 shadow-lg shadow-black/40 backdrop-blur-md transition-all duration-300 ease-out hover:border-sky-500/50 hover:bg-zinc-800 hover:text-sky-300 active:scale-95",
        aboveMobileNav
          ? "bottom-[calc(10.5rem+env(safe-area-inset-bottom,0px))] right-4 sm:bottom-[5.5rem]"
          : "bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 sm:bottom-6",
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
        className,
      )}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
