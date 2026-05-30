"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  COACH_HUB_TABS,
  coachHubHref,
  type CoachHubTab,
} from "@/constants/coach-hub";
import {
  fetchCoachHubStats,
  type CoachHubStats,
} from "@/lib/firebase/coach-hub-stats";
import { cn } from "@/lib/utils/cn";

interface CoachHubOverviewProps {
  coachId: string;
  onNavigate: (tab: CoachHubTab) => void;
}

type StatCard = {
  tab: CoachHubTab;
  label: string;
  value: number | string;
  hint: string;
  urgent?: boolean;
};

export function CoachHubOverview({ coachId, onNavigate }: CoachHubOverviewProps) {
  const [stats, setStats] = useState<CoachHubStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await fetchCoachHubStats(coachId));
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    void load();
  }, [load]);

  const cards: StatCard[] = stats
    ? [
        {
          tab: "reservas",
          label: "Por confirmar",
          value: stats.pendingBookings,
          hint: "Solicitudes web o panel",
          urgent: stats.pendingBookings > 0,
        },
        {
          tab: "facturacion",
          label: "Sin factura",
          value: stats.pendingInvoices,
          hint: "Reservas pagadas",
          urgent: stats.pendingInvoices > 0,
        },
        {
          tab: "tribu",
          label: "Tribu pendiente",
          value: stats.pendingTribePosts,
          hint: "Fotos y vídeos por aprobar",
          urgent: stats.pendingTribePosts > 0,
        },
        {
          tab: "alumnos",
          label: "Vídeos por revisar",
          value: stats.pendingVideos,
          hint: "Corrección de vídeo",
          urgent: stats.pendingVideos > 0,
        },
        {
          tab: "reservas",
          label: "Próximas clases",
          value: stats.upcomingBookings,
          hint: "En agenda",
        },
        {
          tab: "alumnos",
          label: "Alumnos",
          value: stats.studentCount,
          hint: "Registrados en la app",
        },
        {
          tab: "mercadillo",
          label: "Anuncios activos",
          value: stats.activeListings,
          hint: "Mercadillo público",
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Todo el proyecto desde un solo panel: reservas, facturas, alumnos,
          tribu y mercadillo.
        </p>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm text-zinc-500 hover:text-sky-400"
        >
          Actualizar
        </button>
      </div>

      {loading && (
        <p className="text-sm text-zinc-500">Cargando resumen…</p>
      )}

      {!loading && stats && (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => (
            <li key={`${card.tab}-${card.label}`}>
              <button
                type="button"
                onClick={() => onNavigate(card.tab)}
                className={cn(
                  "flex h-full w-full flex-col rounded-2xl border p-5 text-left transition hover:border-sky-500/40",
                  card.urgent
                    ? "border-amber-500/35 bg-amber-500/5"
                    : "border-zinc-800 bg-zinc-900/40",
                )}
              >
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {card.label}
                </span>
                <span
                  className={cn(
                    "mt-2 text-3xl font-bold tabular-nums",
                    card.urgent ? "text-amber-200" : "text-zinc-100",
                  )}
                >
                  {card.value}
                </span>
                <span className="mt-2 text-sm text-zinc-500">{card.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <section>
        <h2 className="text-lg font-semibold text-zinc-100">Secciones</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {COACH_HUB_TABS.filter((t) => t.id !== "inicio").map((tab) => (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onNavigate(tab.id)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-5 py-4 text-left transition hover:border-sky-500/35"
              >
                <p className="font-medium text-zinc-100">{tab.label}</p>
                <p className="mt-1 text-sm text-zinc-500">{tab.description}</p>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5">
        <h2 className="text-sm font-semibold text-zinc-200">Accesos rápidos</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/reservar"
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-sky-400"
          >
            + Nueva reserva
          </Link>
          <Link
            href="/tribu"
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500"
          >
            Ver La Tribu (web)
          </Link>
          <Link
            href="/mercadillo"
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500"
          >
            Ver mercadillo (web)
          </Link>
          <Link
            href={coachHubHref("reservas")}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500"
          >
            Ir a reservas
          </Link>
        </div>
      </section>
    </div>
  );
}
