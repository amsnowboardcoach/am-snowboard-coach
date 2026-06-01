"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  countPaidWithoutInvoice,
  fetchCoachBookings,
} from "@/lib/firebase/bookings";
import { bookingAwaitingCoachApproval } from "@/lib/booking/slot-hold";
import type { Booking } from "@/types/firestore";
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

  const filters: { id: Filter; label: string }[] = [
    {
      id: "pending_requests",
      label: `Por confirmar (${pendingRequestCount})`,
    },
    { id: "all", label: "Todas" },
    {
      id: "pending_invoice",
      label: `Sin factura (${pendingInvoiceCount})`,
    },
    { id: "upcoming", label: "Próximas" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              filter === f.id
                ? "bg-sky-500 text-zinc-950"
                : "border border-zinc-700 text-zinc-400 hover:border-zinc-500"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {pendingRequestCount > 0 && (
        <p className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-200">
          {pendingRequestCount} solicitud
          {pendingRequestCount > 1 ? "es" : ""} de reserva esperando tu
          confirmación.
        </p>
      )}

      {pendingInvoiceCount > 0 && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          {pendingInvoiceCount} reserva
          {pendingInvoiceCount > 1 ? "s" : ""} pagada
          {pendingInvoiceCount > 1 ? "s" : ""} sin factura
        </p>
      )}

      {loading && (
        <p className="text-center text-zinc-500">Cargando reservas…</p>
      )}

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="rounded-2xl border border-dashed border-zinc-700 py-16 text-center text-zinc-500">
          No hay reservas con este filtro. Puedes crear una manual en el
          formulario de abajo.
        </p>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-4">
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
        />
      )}
    </div>
  );
}
