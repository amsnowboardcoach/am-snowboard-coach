"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_MOBILE_TAB_BAR } from "@/constants/site-navigation";
import { ALUMNO_AREA_PATH } from "@/constants/alumno-area";
import { cn } from "@/lib/utils/cn";
import { scrollToTop } from "@/lib/navigation/scroll";

export function MobileBottomNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800/90 bg-zinc-950/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md lg:hidden"
      aria-label="Accesos rápidos"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pt-2 pb-1">
        {SITE_MOBILE_TAB_BAR.map((item) => {
          const active =
            item.href === ALUMNO_AREA_PATH
              ? pathname === ALUMNO_AREA_PATH ||
                pathname.startsWith("/registro") ||
                pathname.startsWith("/perfil")
              : pathname === item.href ||
                pathname.startsWith(`${item.href}/`);
          const isPrimary = item.primary;

          if (isPrimary) {
            return (
              <li key={item.href} className="flex flex-1 justify-center px-1">
                <Link
                  href={item.href}
                  aria-label={item.label}
                  onClick={() => scrollToTop()}
                  className={cn(
                    "-mt-4 flex min-h-14 min-w-[4.5rem] flex-col items-center justify-center rounded-full bg-sky-500 px-3 py-2 text-center text-[10px] font-bold text-zinc-950 shadow-lg shadow-sky-500/30 transition active:scale-95 active:bg-sky-400",
                    active && "ring-2 ring-sky-300/50",
                  )}
                >
                  <span className="text-xs leading-tight">{item.shortLabel}</span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href} className="flex flex-1">
              <Link
                href={item.href}
                aria-label={item.label}
                onClick={() => scrollToTop()}
                className={cn(
                  "flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium transition active:scale-95",
                  active ? "text-sky-400" : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                <TabIcon href={item.href} active={active} />
                <span>{item.shortLabel ?? item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function TabIcon({ href, active }: { href: string; active: boolean }) {
  const className = cn("size-5", active ? "text-sky-400" : "text-zinc-500");
  switch (href) {
    case ALUMNO_AREA_PATH:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" strokeLinecap="round" />
        </svg>
      );
    case "/clases":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 16l4-8 4 6 4-10 4 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "/mercadillo":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 6h15l-1.5 9H8L6 6z" strokeLinejoin="round" />
          <path d="M6 6L5 3H2M9 20a1 1 0 102 0 1 1 0 00-2 0zm8 0a1 1 0 102 0 1 1 0 00-2 0z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "/tribu":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="9" cy="8" r="3" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M3 20c0-3 3-5 6-5s6 2 6 5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}
