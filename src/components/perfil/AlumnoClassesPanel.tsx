"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  BOOKING_MEETING_POINT,
  BOOKING_MEETING_POINT_LABEL,
} from "@/constants/booking-info";
import {
  BOOKING_BALANCE_PAYMENT_LABEL,
  BOOKING_DEPOSIT_PERCENT,
} from "@/constants/booking-payment";
import { formatBookingWhen } from "@/lib/booking/format-datetime";
import { isSessionPaymentSettled } from "@/lib/booking/slot-hold";
import { fetchAlumnoBookings } from "@/lib/firebase/bookings";
import { linkAlumnoBookingsForCurrentUser } from "@/lib/firebase/link-alumno-bookings-client";
import { centsToEuros } from "@/lib/utils/money";
import { reservarHref } from "@/lib/booking/reservar-url";
import type { Booking, BookingStatus } from "@/types/firestore";
import { cn } from "@/lib/utils/cn";

interface AlumnoClassesPanelProps {
  userId: string;
  /** Vista compacta en perfil (próximas + última pasada). */
  compact?: boolean;
}

const statusLabels: Record<BookingStatus, string> = {
  pending: "Solicitud enviada",
  confirmed: "Clase confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No asistencia",
};

function alumnoStatusLabel(booking: Booking): string {
  if (booking.status === "cancelled") {
    if (booking.payment.status === "refunded") {
      return "No confirmada · pago devuelto";
    }
    return "Solicitud no confirmada";
  }
  if (booking.status === "confirmed" || booking.status === "completed") {
    return statusLabels[booking.status];
  }
  if (
    booking.status === "pending" &&
    isSessionPaymentSettled(booking.payment.status)
  ) {
    return "Pago recibido — pendiente de confirmación";
  }
  if (booking.status === "pending" && booking.payment.status === "pending") {
    return "Pendiente de pago";
  }
  return statusLabels[booking.status];
}

function statusTone(booking: Booking): string {
  if (booking.status === "confirmed") {
    return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
  }
  if (booking.status === "cancelled") {
    return "border-zinc-700 bg-zinc-800/50 text-zinc-500";
  }
  if (
    booking.status === "pending" &&
    isSessionPaymentSettled(booking.payment.status)
  ) {
    return "border-amber-500/40 bg-amber-500/10 text-amber-100";
  }
  return "border-sky-500/30 bg-sky-500/10 text-sky-100";
}

function ClassCard({ booking }: { booking: Booking }) {
  const start = booking.startAt.toDate();
  const end = booking.endAt.toDate();
  const when = formatBookingWhen(start, end);
  const totalCents =
    booking.payment.totalAmountCents ?? booking.payment.amountCents;
  const balanceCents = booking.payment.balanceAmountCents ?? 0;
  const needsPayment =
    booking.status === "pending" && booking.payment.status === "pending";
  const showMeetingPoint = booking.status === "confirmed";

  return (
    <article
      className={cn(
        "rounded-xl border p-4 sm:p-5",
        booking.status === "cancelled" ? "border-zinc-800 opacity-70" : "border-zinc-800 bg-zinc-900/30",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-zinc-100">{when}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {booking.lessonTypeName}
            {booking.sessionSlotLabel ? ` · ${booking.sessionSlotLabel}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium",
            statusTone(booking),
          )}
        >
          {alumnoStatusLabel(booking)}
        </span>
      </div>

      <ul className="mt-3 space-y-1 text-sm text-zinc-400">
        <li>
          Importe: <strong className="text-zinc-200">{centsToEuros(totalCents)} €</strong>
        </li>
        {booking.payment.status === "deposit_paid" && balanceCents > 0 && (
          <li>
            Resto en pista ({BOOKING_BALANCE_PAYMENT_LABEL}):{" "}
            <strong className="text-zinc-200">{centsToEuros(balanceCents)} €</strong>
          </li>
        )}
        {booking.payment.status === "deposit_paid" && (
          <li>Señal del {BOOKING_DEPOSIT_PERCENT}% pagada con tarjeta</li>
        )}
        {booking.participantCount && booking.participantCount > 1 && (
          <li>{booking.participantCount} personas en pista</li>
        )}
      </ul>

      {showMeetingPoint && (
        <p className="mt-3 text-sm text-zinc-300">
          <span className="text-zinc-500">{BOOKING_MEETING_POINT_LABEL}: </span>
          {BOOKING_MEETING_POINT}
        </p>
      )}

      {needsPayment && (
        <p className="mt-4">
          <Link
            href={`/pagar/${booking.id}`}
            className="inline-flex rounded-full bg-sky-500/90 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400"
          >
            Completar pago
          </Link>
        </p>
      )}
    </article>
  );
}

export function AlumnoClassesPanel({
  userId,
  compact = false,
}: AlumnoClassesPanelProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await linkAlumnoBookingsForCurrentUser();
      const list = await fetchAlumnoBookings(userId);
      setBookings(list);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar tus clases",
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const now = Date.now();
  const upcoming = bookings.filter(
    (b) => b.status !== "cancelled" && b.endAt.toMillis() >= now,
  );
  const past = bookings
    .filter((b) => b.status === "cancelled" || b.endAt.toMillis() < now)
    .sort((a, b) => b.startAt.toMillis() - a.startAt.toMillis());

  const visibleUpcoming = compact ? upcoming.slice(0, 3) : upcoming;
  const visiblePast = compact ? past.slice(0, 2) : past;

  if (loading) {
    return (
      <p className="text-sm text-zinc-500">
        {compact ? "Cargando clases…" : "Cargando tus clases…"}
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </p>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="text-sm text-zinc-400">
        <p>Aún no tienes clases reservadas en tu cuenta.</p>
        <Link href={reservarHref()} className="mt-2 inline-block font-medium link-accent">
          Reservar clase →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {visibleUpcoming.length > 0 && (
        <div>
          {!compact && (
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Próximas clases
            </h3>
          )}
          <ul className="space-y-3">
            {visibleUpcoming.map((b) => (
              <li key={b.id}>
                <ClassCard booking={b} />
              </li>
            ))}
          </ul>
          {compact && upcoming.length > visibleUpcoming.length && (
            <p className="mt-2 text-xs text-zinc-500">
              +{upcoming.length - visibleUpcoming.length} más en camino
            </p>
          )}
        </div>
      )}

      {visiblePast.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {compact ? "Anteriores" : "Clases anteriores"}
          </h3>
          <ul className="space-y-3">
            {visiblePast.map((b) => (
              <li key={b.id}>
                <ClassCard booking={b} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {upcoming.length === 0 && past.length > 0 && !compact && (
        <p className="text-sm text-zinc-500">
          No tienes clases próximas.{" "}
          <Link href={reservarHref()} className="link-accent">
            Reserva otra fecha
          </Link>
        </p>
      )}
    </div>
  );
}
