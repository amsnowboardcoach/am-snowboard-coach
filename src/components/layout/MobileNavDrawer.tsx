"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { scrollToTop } from "@/lib/navigation/scroll";
import { cn } from "@/lib/utils/cn";

export interface MobileNavLink {
  href: string;
  label: string;
  /** Botón destacado (CTA) */
  primary?: boolean;
  onClick?: () => void;
}

interface MobileNavDrawerProps {
  links: MobileNavLink[];
  className?: string;
}

export function MobileNavDrawer({ links, className }: MobileNavDrawerProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const regular = links.filter((l) => !l.primary);
  const cta = links.find((l) => l.primary);

  const panel = open && mounted && (
    <div
      className="fixed inset-0 z-[100] lg:hidden"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md transition-opacity"
        aria-label="Cerrar menú"
        onClick={() => setOpen(false)}
      />
      <nav
        id="mobile-nav-drawer"
        className={cn(
          "absolute inset-y-0 right-0 flex w-[min(100vw-2.5rem,20rem)] flex-col",
          "border-l border-zinc-700/80 bg-zinc-950 shadow-[-12px_0_40px_rgba(0,0,0,0.55)]",
          "pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]",
        )}
        aria-label="Menú principal"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <span className="text-sm font-semibold tracking-wide text-zinc-200">
            Menú
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex size-11 items-center justify-center rounded-xl border border-zinc-700/80 bg-zinc-800/80 text-zinc-300 active:bg-zinc-700"
            aria-label="Cerrar menú"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto overscroll-contain bg-zinc-950 px-2 py-3">
          {regular.map((item) => (
            <li key={`${item.href}-${item.label}`}>
              {item.onClick ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    item.onClick?.();
                  }}
                  className="flex min-h-12 w-full items-center rounded-xl px-4 text-left text-base font-medium text-zinc-100 active:bg-zinc-800"
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  href={item.href}
                  onClick={() => {
                    setOpen(false);
                    scrollToTop();
                  }}
                  className="flex min-h-12 items-center rounded-xl px-4 text-base font-medium text-zinc-100 transition active:bg-zinc-800"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
        {cta && (
          <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/50 p-4">
            <Link
              href={cta.href}
              onClick={() => {
                setOpen(false);
                scrollToTop();
              }}
              className="flex min-h-12 items-center justify-center rounded-full bg-sky-500 px-6 text-base font-semibold text-zinc-950 shadow-lg shadow-sky-500/25 transition active:scale-[0.98] active:bg-sky-400"
            >
              {cta.label}
            </Link>
          </div>
        )}
      </nav>
    </div>
  );

  return (
    <>
      <div className={cn("lg:hidden", className)}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "relative z-[1] flex size-11 shrink-0 items-center justify-center rounded-xl border text-zinc-200 transition",
            open
              ? "border-sky-500/50 bg-zinc-800 text-sky-300"
              : "border-zinc-700/80 bg-zinc-900/60 active:bg-zinc-800",
          )}
          aria-expanded={open}
          aria-controls="mobile-nav-drawer"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
