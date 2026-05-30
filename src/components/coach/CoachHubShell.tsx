"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";
import {
  COACH_HUB_DEFAULT_TAB,
  COACH_HUB_TABS,
  coachHubHref,
  isCoachHubTab,
  type CoachHubTab,
} from "@/constants/coach-hub";
import { CoachBookingsPanel } from "@/components/coach/CoachBookingsPanel";
import { CoachHubInvoicingPanel } from "@/components/coach/CoachHubInvoicingPanel";
import { CoachHubMarketplacePanel } from "@/components/coach/CoachHubMarketplacePanel";
import { CoachHubOverview } from "@/components/coach/CoachHubOverview";
import { CoachHubStudentsPanel } from "@/components/coach/CoachHubStudentsPanel";
import { TribeModerationPanel } from "@/components/coach/TribeModerationPanel";
import { cn } from "@/lib/utils/cn";

interface CoachHubShellProps {
  coachId: string;
  displayName: string;
}

function CoachHubShellInner({ coachId, displayName }: CoachHubShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: CoachHubTab = isCoachHubTab(tabParam)
    ? tabParam
    : COACH_HUB_DEFAULT_TAB;

  const setTab = useCallback(
    (tab: CoachHubTab) => {
      router.push(coachHubHref(tab), { scroll: false });
    },
    [router],
  );

  const activeMeta = useMemo(
    () => COACH_HUB_TABS.find((t) => t.id === activeTab) ?? COACH_HUB_TABS[0],
    [activeTab],
  );

  return (
    <div className="lg:flex lg:gap-8">
      <aside className="lg:w-56 lg:shrink-0">
        <nav
          className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0"
          aria-label="Secciones del panel coach"
        >
          {COACH_HUB_TABS.map((tab) => (
            <Link
              key={tab.id}
              href={coachHubHref(tab.id)}
              scroll={false}
              className={cn(
                "shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition lg:w-full lg:text-left",
                activeTab === tab.id
                  ? "bg-sky-500 text-zinc-950"
                  : "border border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200",
              )}
            >
              {tab.label}
            </Link>
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

      <div className="min-w-0 flex-1">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-400/90">
            Panel del coach
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{activeMeta.label}</h1>
          <p className="mt-1 text-sm text-zinc-500">{displayName}</p>
          <p className="mt-2 text-sm text-zinc-400">{activeMeta.description}</p>
        </header>

        {activeTab === "inicio" && (
          <CoachHubOverview coachId={coachId} onNavigate={setTab} />
        )}

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
