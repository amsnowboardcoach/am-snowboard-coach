"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  countPaidWithoutInvoice,
  fetchCoachBookings,
} from "@/lib/firebase/bookings";
import { bookingAwaitingCoachApproval } from "@/lib/booking/slot-hold";
import type { Booking } from "@/types/firestore";
import { cn } from "@/lib/utils/cn";
import { BookingCard } from "./BookingCard";
import { CreateBookingForm } from "./CreateBookingForm";

type Filter = "all" | "pending_requests" | "pending_invoice" | "upcoming";

interface CoachBookingsPanelProps {
  coachId: string;
  initialFilter?: Filter;
  showCreateForm?: boolean;
}

export function CoachBookingsPanel({
  coachId,
  initialFilter = "all",
  showCreateForm = true,
}: CoachBookingsPanelProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCoachBookings(coachId);
      setBookings(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar reservas";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    let active = true;

    (async () => {
      setError(null);
      try {
        const data = await fetchCoachBookings(coachId);
        if (active) setBookings(data);
      } catch (err) {
        if (!active) return;
        const msg =
          err instanceof Error ? err.message : "Error al cargar reservas";
        setError(msg);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [coachId]);

  const pendingInvoiceCount = useMemo(
    () => countPaidWithoutInvoice(bookings),
    [bookings],
  );

  const pendingRequestCount = useMemo(
    () => bookings.filter((b) => bookingAwaitingCoachApproval(b)).length,
    [bookings],
  );

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filter === "pending_requests") {
        return bookingAwaitingCoachApproval(b);
      }
      if (filter === "pending_invoice") {
        return (
          b.payment.status === "paid" && b.invoice.status === "pending"
        );
      }
      if (filter === "upcoming") {
        return b.startAt.toMillis() >= now && b.status !== "cancelled";
      }
      return true;
    });
  }, [bookings, filter, now]);

  const filters: {
    id: Filter;
    label: string;
    shortLabel: string;
  }[] = [
    {
      id: "pending_requests",
      label: `Por confirmar (${pendingRequestCount})`,
      shortLabel: `Confirmar (${pendingRequestCount})`,
    },
    { id: "all", label: "Todas", shortLabel: "Todas" },
    {
      id: "pending_invoice",
      label: `Sin factura (${pendingInvoiceCount})`,
      shortLabel: `Factura (${pendingInvoiceCount})`,
    },
    { id: "upcoming", label: "Próximas", shortLabel: "Próximas" },
  ];

  return (
    <div className="space-y-5 pb-24 sm:space-y-6 sm:pb-8 lg:pb-0">
      <div className="-mx-1 px-1">
        <div
          className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Filtrar reservas"
        >
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 touch-manipulation rounded-full px-3.5 py-2 text-xs font-medium transition sm:px-4 sm:text-sm",
                filter === f.id
                  ? "chip-toggle-active shadow-sm shadow-sky-950/25"
                  : "border border-zinc-700/90 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600",
              )}
            >
              <span className="sm:hidden">{f.shortLabel}</span>
              <span className="hidden sm:inline">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {pendingRequestCount > 0 && filter !== "pending_requests" && (
        <button
          type="button"
          onClick={() => setFilter("pending_requests")}
          className="w-full rounded-xl border border-sky-500/35 bg-sky-500/10 px-4 py-3 text-left text-sm text-sky-100 transition hover:bg-sky-500/15"
        >
          <span className="font-semibold">{pendingRequestCount}</span>{" "}
          {pendingRequestCount === 1 ? "solicitud espera" : "solicitudes esperan"}{" "}
          confirmación →
        </button>
      )}

      {pendingInvoiceCount > 0 && filter !== "pending_invoice" && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-100/90">
          {pendingInvoiceCount} pagada
          {pendingInvoiceCount > 1 ? "s" : ""} sin factura emitida
        </p>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <p className="text-sm text-zinc-500">Cargando reservas…</p>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="glass-panel rounded-2xl px-6 py-12 text-center sm:py-14">
          <p className="text-3xl" aria-hidden>
            📅
          </p>
          <p className="mt-3 font-medium text-zinc-200">
            Nada con este filtro
          </p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-zinc-500">
            Prueba otro filtro o crea una reserva manual con el botón de abajo.
          </p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              coachId={coachId}
              onUpdated={load}
            />
          ))}
        </div>
      )}

      {showCreateForm && (
        <CreateBookingForm
          coachId={coachId}
          onCreated={load}
          defaultOpen={false}
          stickyMobileCta
        />
      )}
    </div>
  );
}
