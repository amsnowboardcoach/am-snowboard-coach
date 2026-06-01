"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo } from "react";
import {
  COACH_HUB_TABS,
  coachHubHref,
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

function CoachHubShellInner({ coachId, displayName }: CoachHubShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab = parseCoachHubTab(tabParam);

  /** Normaliza /coach sin ?tab= o con tab inválido (evita secciones atascadas en móvil). */
  useEffect(() => {
    if (pathname !== "/coach") return;
    if (tabParam !== activeTab) {
      router.replace(coachHubHref(activeTab), { scroll: false });
    }
  }, [pathname, tabParam, activeTab, router]);

  const navigateTab = useCallback(
    (tab: CoachHubTab) => {
      if (tab === activeTab) {
        scrollToTop({ behavior: "auto" });
        return;
      }
      router.push(coachHubHref(tab), { scroll: false });
      scrollToTop({ behavior: "auto" });
    },
    [activeTab, router],
  );

  const activeMeta = useMemo(
    () => COACH_HUB_TABS.find((t) => t.id === activeTab) ?? COACH_HUB_TABS[0],
    [activeTab],
  );

  return (
    <div className="lg:flex lg:gap-10 xl:gap-12">
      <CoachPushActivator />
      <aside className="lg:w-56 lg:shrink-0">
        <nav
          className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-1 lg:gap-2"
          aria-label="Secciones del panel coach"
        >
          {COACH_HUB_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigateTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={cn(
                "min-h-11 touch-manipulation rounded-xl px-3 py-2.5 text-sm font-medium transition active:scale-[0.98] lg:w-full lg:text-left",
                activeTab === tab.id
                  ? "bg-sky-500 text-zinc-950"
                  : "border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200",
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 hidden space-y-2 lg:block">
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

      <div key={activeTab} className="min-w-0 flex-1">
        <header className="mb-8 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-400/90">
            Panel del coach
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{activeMeta.label}</h1>
          <p className="mt-1 text-sm text-zinc-500">{displayName}</p>
          <p className="mt-2 text-sm text-zinc-400">{activeMeta.description}</p>
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
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-400">
                Aprueba o rechaza publicaciones antes de que salgan en La Tribu.
              </p>
              <Link
                href="/tribu"
                className="text-sm text-sky-400 hover:text-sky-300"
              >
                Ver feed público →
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
