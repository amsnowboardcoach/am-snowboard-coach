"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SiteHeaderLogo } from "@/components/layout/SiteHeaderLogo";
import { STUDENT_AREA_PATH } from "@/constants/student-area";
import { scrollToTop } from "@/lib/navigation/scroll";
import { cn } from "@/lib/utils/cn";

export interface MobileNavLink {
  href: string;
  label: string;
  /** Botón destacado (CTA) al pie del menú */
  primary?: boolean;
  onClick?: () => void;
  /** Estilo para cerrar sesión */
  variant?: "default" | "danger";
}

interface MobileNavDrawerProps {
  links: MobileNavLink[];
  className?: string;
}

const DRAWER_TRANSITION_MS = 280;

function isLinkActive(pathname: string, href: string): boolean {
  if (href === "#" || !href.startsWith("/")) return false;
  if (href === "/") return pathname === "/";
  const path = href.split("?")[0]!;
  return pathname === path || pathname.startsWith(`${path}/`);
}

function linkPath(href: string): string {
  return href.split("?")[0] ?? href;
}

function isStudentAreaHref(href: string): boolean {
  const path = linkPath(href);
  return path === STUDENT_AREA_PATH || path === "/registro";
}

/** Icono de «Área de alumno» (mismo que la barra inferior móvil) */
function StudentAreaIcon({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" strokeLinecap="round" />
    </svg>
  );
}

function NavItemIcon({ href, label }: { href: string; label?: string }) {
  const className = "size-5 shrink-0 text-zinc-500";
  const isStudentArea =
    isStudentAreaHref(href) ||
    label === "Área de alumno" ||
    label === "Entrar";

  if (href.startsWith("/coach")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    );
  }
  if (isStudentArea || href.startsWith("/perfil")) {
    return <StudentAreaIcon className={className} />;
  }
  if (href.startsWith("/clases")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M4 16l4-8 4 6 4-10 4 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (href.startsWith("/tarifas")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M12 3v18M8 7h8M7 12h10M6 17h12" strokeLinecap="round" />
      </svg>
    );
  }
  if (href.startsWith("/tribu")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2.5 2-4 4-4" strokeLinecap="round" />
      </svg>
    );
  }
  if (href.startsWith("/mercadillo")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M6 6h15l-1.5 9H8L6 6z" strokeLinejoin="round" />
        <path d="M6 6L5 3H2M9 20a1 1 0 102 0M18 20a1 1 0 102 0" strokeLinecap="round" />
      </svg>
    );
  }
  if (href.startsWith("/blog")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M6 4h9l3 3v13H6z" strokeLinejoin="round" />
        <path d="M9 12h6M9 16h4" strokeLinecap="round" />
      </svg>
    );
  }
  if (href.startsWith("/sobre-mi")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M4 20h16" strokeLinecap="round" />
        <path d="M6 20l5-12 2.5 6 2.5-6L19 20" strokeLinejoin="round" />
      </svg>
    );
  }
  if (href.startsWith("/reservar")) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 11h16" strokeLinecap="round" />
      </svg>
    );
  }
  if (href === "/") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function itemClassName(active: boolean, variant: MobileNavLink["variant"]) {
  if (variant === "danger") {
    return cn(
      "flex min-h-[3rem] w-full items-center gap-3 rounded-xl px-3.5 text-left text-base font-medium transition active:scale-[0.99]",
      "text-red-300/95 hover:bg-red-500/10 active:bg-red-500/15",
    );
  }
  return cn(
    "flex min-h-[3rem] w-full items-center gap-3 rounded-xl px-3.5 text-left text-base font-medium transition active:scale-[0.99]",
    active
      ? "bg-sky-500/15 text-sky-100 ring-1 ring-sky-500/35"
      : "text-zinc-200 hover:bg-zinc-900/90 active:bg-zinc-800/80",
  );
}

export function MobileNavDrawer({ links, className }: MobileNavDrawerProps) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);

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
    if (open) {
      setPanelVisible(true);
      return;
    }
    const timer = window.setTimeout(
      () => setPanelVisible(false),
      DRAWER_TRANSITION_MS,
    );
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const cta = links.find((l) => l.primary);
  const danger = links.filter((l) => l.variant === "danger" || (l.onClick && l.href === "#"));
  const dangerKeys = new Set(danger.map((l) => `${l.href}-${l.label}`));
  const regular = links.filter((l) => !l.primary && !dangerKeys.has(`${l.href}-${l.label}`));

  const close = () => setOpen(false);

  const panel =
    (open || panelVisible) && mounted ? (
      <div
        className="fixed inset-0 z-[100] lg:hidden"
        role="presentation"
        aria-hidden={!open}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-zinc-950/70 backdrop-blur-sm transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
          aria-label="Cerrar menú"
          tabIndex={open ? 0 : -1}
          onClick={close}
        />
        <nav
          id="mobile-nav-drawer"
          className={cn(
            "absolute inset-y-0 right-0 flex w-[min(100vw-1rem,22rem)] flex-col",
            "border-l border-zinc-800/90 bg-zinc-950 shadow-[-16px_0_48px_rgba(0,0,0,0.5)]",
            "transition-transform duration-300 ease-out motion-reduce:transition-none",
            open ? "translate-x-0" : "translate-x-full",
            "pt-[max(0.5rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          )}
          aria-label="Menú principal"
          aria-modal="true"
          inert={!open ? true : undefined}
        >
          <div className="flex items-center justify-between gap-3 border-b border-zinc-800/90 px-4 py-3">
            <SiteHeaderLogo
              className="min-w-0 shrink py-1 text-base sm:text-lg"
              onClick={() => {
                close();
                scrollToTop();
              }}
            />
            <button
              type="button"
              onClick={close}
              className="btn-ghost flex size-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700/90 bg-zinc-900/60"
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

          <ul className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
            {regular.length > 0 && (
              <li className="mb-2 px-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Explorar
                </span>
              </li>
            )}
            {regular.map((item) => {
              const active = isLinkActive(pathname, item.href);
              const rowClass = itemClassName(active, item.variant);

              return (
                <li key={`${item.href}-${item.label}`} className="mb-0.5">
                  {item.onClick ? (
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        item.onClick?.();
                      }}
                      className={rowClass}
                    >
                      <NavItemIcon href={item.href} label={item.label} />
                      <span className="min-w-0 flex-1">{item.label}</span>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => {
                        close();
                        scrollToTop();
                      }}
                      className={rowClass}
                      aria-current={active ? "page" : undefined}
                    >
                      <NavItemIcon href={item.href} label={item.label} />
                      <span className="min-w-0 flex-1">{item.label}</span>
                      {active && (
                        <span
                          className="size-1.5 shrink-0 rounded-full bg-sky-400"
                          aria-hidden
                        />
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="shrink-0 space-y-2 border-t border-zinc-800/90 px-3 pt-3">
            {cta && (
              <Link
                href={cta.href}
                onClick={() => {
                  close();
                  scrollToTop();
                }}
                className="btn-primary-md flex w-full min-h-12 items-center justify-center gap-2 shadow-lg shadow-sky-950/40"
              >
                <span className="text-zinc-950">
                  <NavItemIcon href={cta.href} label={cta.label} />
                </span>
                {cta.label}
              </Link>
            )}
            {danger.map((item) => (
              <button
                key={`${item.href}-${item.label}`}
                type="button"
                onClick={() => {
                  close();
                  item.onClick?.();
                }}
                className={itemClassName(false, "danger")}
              >
                <svg
                  className="size-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  aria-hidden
                >
                  <path
                    d="M9 21H5a2 2 0 01-2-2V7a2 2 0 012-2h4M16 3h4a2 2 0 012 2v12a2 2 0 01-2 2h-4M10 12h8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    ) : null;

  return (
    <>
      <div className={cn("lg:hidden", className)}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "relative z-[1] flex size-11 shrink-0 items-center justify-center rounded-xl border transition duration-200",
            open
              ? "border-sky-500/50 bg-sky-500/15 text-sky-300 shadow-sm shadow-sky-950/30"
              : "border-zinc-700/90 bg-zinc-900/80 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-900 hover:text-zinc-100",
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
