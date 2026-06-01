"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  COACH_HUB_DEFAULT_TAB,
  COACH_HUB_TABS,
  coachHubHref,
  isCoachHubTab,
  parseCoachHubTab,
  type CoachHubTab,
} from "@/constants/coach-hub";
import { CoachPushActivator } from "@/components/coach/CoachPushActivator";
import { CoachBookingsPanel } from "@/components/coach/CoachBookingsPanel";
import { CoachHubInvoicingPanel } from "@/components/coach/CoachHubInvoicingPanel";
import { CoachHubMarketplacePanel } from "@/components/coach/CoachHubMarketplacePanel";
import { CoachHubStudentsPanel } from "@/components/coach/CoachHubStudentsPanel";
import { TribeModerationPanel } from "@/components/coach/TribeModerationPanel";
import { scrollToTop } from "@/lib/navigation/scroll";
import { cn } from "@/lib/utils/cn";

interface CoachHubShellProps {
  coachId: string;
  displayName: string;
}

const TAB_ICONS: Record<CoachHubTab, string> = {
  reservas: "📅",
  facturacion: "🧾",
  alumnos: "👥",
  tribu: "🔥",
  mercadillo: "🏷️",
};

function CoachHubShellInner({ coachId, displayName }: CoachHubShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tabFromUrl = parseCoachHubTab(tabParam);

  const [activeTab, setActiveTab] = useState<CoachHubTab>(tabFromUrl);

  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    if (pathname !== "/coach") return;
    if (tabParam === null) {
      router.replace(coachHubHref(COACH_HUB_DEFAULT_TAB), { scroll: false });
      return;
    }
    if (!isCoachHubTab(tabParam)) {
      router.replace(coachHubHref(COACH_HUB_DEFAULT_TAB), { scroll: false });
    }
  }, [pathname, tabParam, router]);

  const activeMeta = useMemo(
    () => COACH_HUB_TABS.find((t) => t.id === activeTab) ?? COACH_HUB_TABS[0],
    [activeTab],
  );

  return (
    <div className="w-full text-left lg:flex lg:gap-10 xl:gap-12">
      <CoachPushActivator />

      {/* Móvil: pestañas horizontales compactas */}
      <div className="sticky top-[calc(3.25rem+env(safe-area-inset-top,0px))] z-30 -mx-4 border-b border-zinc-800/90 bg-zinc-950/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 lg:hidden">
        <nav
          className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Secciones del panel coach"
        >
          {COACH_HUB_TABS.map((tab) => (
            <Link
              key={tab.id}
              href={coachHubHref(tab.id)}
              scroll={false}
              onClick={() => {
                setActiveTab(tab.id);
                scrollToTop({ behavior: "auto" });
              }}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={cn(
                "flex shrink-0 touch-manipulation items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition active:scale-[0.98] sm:text-sm",
                activeTab === tab.id
                  ? "chip-toggle-active shadow-md shadow-sky-950/30"
                  : "chip-toggle-inactive border-zinc-700/90 bg-zinc-900/60",
              )}
            >
              <span aria-hidden className="text-sm leading-none">
                {TAB_ICONS[tab.id]}
              </span>
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Escritorio: barra lateral */}
      <aside className="hidden lg:block lg:w-56 lg:shrink-0">
        <nav
          className="grid gap-2"
          aria-label="Secciones del panel coach"
        >
          {COACH_HUB_TABS.map((tab) => (
            <Link
              key={tab.id}
              href={coachHubHref(tab.id)}
              scroll={false}
              onClick={() => {
                setActiveTab(tab.id);
                scrollToTop({ behavior: "auto" });
              }}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={cn(
                "flex min-h-11 w-full touch-manipulation items-center rounded-xl px-3 py-2.5 text-sm font-medium transition",
                activeTab === tab.id
                  ? "chip-toggle-active"
                  : "chip-toggle-inactive border-zinc-800 bg-transparent hover:border-zinc-600",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="mt-6 space-y-2">
          <Link
            href="/reservar"
            className="flex w-full items-center justify-center rounded-full bg-sky-500/15 py-2.5 text-sm font-medium text-sky-300 ring-1 ring-sky-500/30 hover:bg-sky-500/25"
          >
            + Nueva reserva
          </Link>
          <Link
            href="/"
            className="block w-full rounded-xl border border-zinc-800 py-2.5 text-center text-sm text-zinc-500 hover:text-zinc-300"
          >
            Web pública
          </Link>
        </div>
      </aside>

      <div key={activeTab} className="min-w-0 flex-1 lg:pt-0">
        <header className="mb-5 sm:mb-8 lg:mb-10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-400/90 sm:text-xs">
                Panel del coach
              </p>
              <h1 className="mt-0.5 truncate text-xl font-bold sm:text-2xl lg:text-3xl">
                {activeMeta.label}
              </h1>
              <p className="mt-1 truncate text-xs text-zinc-500 sm:text-sm">
                {displayName}
              </p>
            </div>
            <Link
              href="/reservar"
              className="btn-primary-sm btn-inline flex min-h-10 shrink-0 sm:text-sm lg:hidden"
            >
              + Reserva
            </Link>
          </div>
          <p className="mt-2 hidden text-sm text-zinc-400 sm:block">
            {activeMeta.description}
          </p>
        </header>

        {activeTab === "reservas" && (
          <CoachBookingsPanel coachId={coachId} initialFilter="pending_requests" />
        )}

        {activeTab === "facturacion" && (
          <CoachHubInvoicingPanel coachId={coachId} />
        )}

        {activeTab === "alumnos" && (
          <CoachHubStudentsPanel coachId={coachId} />
        )}

        {activeTab === "tribu" && (
          <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-400">
                Aprueba o rechaza publicaciones antes de que salgan en La Tribu.
              </p>
              <Link
                href="/tribu"
                className="shrink-0 text-sm font-medium link-accent"
              >
                Ver feed →
              </Link>
            </div>
            <TribeModerationPanel hideWhenEmpty={false} />
          </div>
        )}

        {activeTab === "mercadillo" && <CoachHubMarketplacePanel />}
      </div>
    </div>
  );
}

export function CoachHubShell(props: CoachHubShellProps) {
  return (
    <Suspense fallback={<p className="text-zinc-500">Cargando panel…</p>}>
      <CoachHubShellInner {...props} />
    </Suspense>
  );
}
