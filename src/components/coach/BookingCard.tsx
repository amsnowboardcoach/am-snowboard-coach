"use client";

import { useState } from "react";
import {
  confirmBookingApi,
  markBookingPaidApi,
  rejectBookingApi,
} from "@/lib/firebase/coach-booking-actions";
import { formatFirestoreDate } from "@/lib/utils/dates";
import { centsToEuros } from "@/lib/utils/money";
import {
  BOOKING_BALANCE_ON_SLOPE,
  BOOKING_BALANCE_PAYMENT_LABEL,
  BOOKING_DEPOSIT_PERCENT,
} from "@/constants/booking-payment";
import { bookingAwaitingCoachApproval } from "@/lib/booking/slot-hold";
import { bookingAlumnoDisplayName } from "@/lib/firebase/booking-alumno-fields";
import { isVideoCorrectionProduct } from "@/constants/video-correction";
import type { Booking } from "@/types/firestore";
import { BookingInvoiceForm } from "./BookingInvoiceForm";

interface BookingCardProps {
  booking: Booking;
  coachId: string;
  onUpdated: () => void;
}

const paymentLabels: Record<string, string> = {
  pending: "Pago pendiente",
  deposit_paid: `Señal ${BOOKING_DEPOSIT_PERCENT}% pagada`,
  paid: "Pagado",
  refunded: "Reembolsado",
};

const statusLabels = {
  pending: "Solicitud pendiente",
  confirmed: "Confirmada",
  cancelled: "Cancelada",
  completed: "Completada",
  no_show: "No show",
};

export function BookingCard({ booking, coachId, onUpdated }: BookingCardProps) {
  const [markingPaid, setMarkingPaid] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isVideo = isVideoCorrectionProduct(booking.lessonTypeId);
  const totalCents =
    booking.payment.totalAmountCents ?? booking.payment.amountCents;
  const balanceCents = booking.payment.balanceAmountCents ?? 0;
  const isDepositPaid = booking.payment.status === "deposit_paid";

  const needsApproval = bookingAwaitingCoachApproval(booking);

  const paymentReady =
    booking.payment.status === "deposit_paid" ||
    booking.payment.status === "paid";

  const awaitsOnlinePayment =
    needsApproval &&
    !isVideo &&
    !paymentReady &&
    (booking.payment.paymentOption === "deposit_30" ||
      booking.payment.paymentOption === "full_stripe" ||
      booking.payment.paymentOption === "after_confirm" ||
      booking.source === "web");

  const awaitsVideoPayment =
    needsApproval && isVideo && !paymentReady && booking.source === "web";

  const canAcceptSession = needsApproval && !isVideo && paymentReady;
  const canAcceptVideo = needsApproval && isVideo && paymentReady;

  const alumnoName = bookingAlumnoDisplayName(booking, "Alumno sin nombre");

  async function confirmRequest() {
    setConfirming(true);
    setActionError(null);
    try {
      await confirmBookingApi(booking.id);
      onUpdated();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error al confirmar",
      );
    } finally {
      setConfirming(false);
    }
  }

  async function rejectRequest() {
    if (
      !window.confirm(
        "¿Rechazar esta solicitud? Se avisará al alumno y, si pagó con tarjeta, se devolverá el importe automáticamente.",
      )
    ) {
      return;
    }
    setRejecting(true);
    setActionError(null);
    try {
      await rejectBookingApi(booking.id);
      onUpdated();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error al rechazar",
      );
    } finally {
      setRejecting(false);
    }
  }

  async function markAsPaid() {
    setMarkingPaid(true);
    setActionError(null);
    try {
      await markBookingPaidApi(booking.id);
      onUpdated();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Error al registrar pago",
      );
    } finally {
      setMarkingPaid(false);
    }
  }

  return (
    <article
      className={`rounded-2xl border p-5 ${
        needsApproval
          ? "border-amber-500/50 bg-amber-500/5"
          : "border-zinc-800 bg-zinc-900/40"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-zinc-100">{alumnoName}</h3>
          {(booking.source === "web" || booking.source === "hub") && (
            <span className="inline-block rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-sky-300">
              Web
            </span>
          )}
          {booking.source === "cal.com" && (
            <span className="inline-block rounded-full bg-sky-500/20 px-2 py-0.5 text-xs text-zinc-500">
              Legacy
            </span>
          )}
          <ol className="mt-3 space-y-1 text-sm text-zinc-400">
            {isVideo ? (
              <>
                <li>
                  <span className="text-zinc-500">Producto: </span>
                  <span className="text-sky-300/90">
                    {booking.sessionSlotLabel ||
                      `${booking.videoCount ?? 1} vídeo${(booking.videoCount ?? 1) > 1 ? "s" : ""}`}
                  </span>
                </li>
                {booking.bookingNotes && (
                  <li>
                    <span className="text-zinc-500">Notas: </span>
                    {booking.bookingNotes}
                  </li>
                )}
              </>
            ) : (
              <>
                <li>
                  <span className="text-zinc-500">1. Día: </span>
                  {formatFirestoreDate(booking.startAt)}
                </li>
                <li>
                  <span className="text-zinc-500">2. Estilo: </span>
                  <span className="text-sky-400/90">{booking.lessonTypeName}</span>
                </li>
                {booking.sessionSlotLabel && (
                  <li>
                    <span className="text-zinc-500">3. Horario: </span>
                    {booking.sessionSlotLabel}
                  </li>
                )}
                <li>
                  <span className="text-zinc-500">4. Personas: </span>
                  {booking.participantCount ?? 1} en pista
                </li>
                {booking.bookingNotes && (
                  <li>
                    <span className="text-zinc-500">5. Notas: </span>
                    {booking.bookingNotes}
                  </li>
                )}
              </>
            )}
          </ol>
        </div>
        <div className="flex shrink-0 items-baseline justify-between gap-4 border-t border-zinc-800/80 pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right">
          <p className="text-lg font-semibold">{centsToEuros(totalCents)}</p>
          {isDepositPaid && balanceCents > 0 && (
            <p className="text-xs text-amber-200/90">
              Señal {centsToEuros(booking.payment.amountCents)} · saldo{" "}
              {centsToEuros(balanceCents)} {BOOKING_BALANCE_PAYMENT_LABEL}
            </p>
          )}
          <p className="text-xs text-zinc-500">
            {paymentLabels[booking.payment.status] ?? booking.payment.status}
            {booking.payment.stripeSessionId &&
            (booking.payment.status === "paid" ||
              booking.payment.status === "deposit_paid")
              ? " (Stripe)"
              : ""}{" "}
            · {statusLabels[booking.status]}
          </p>
        </div>
      </div>

      {needsApproval && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-amber-200">
            {isVideo
              ? awaitsVideoPayment
                ? "Video corrección — el alumno aún no ha pagado con tarjeta. Cuando conste el pago, podrás aceptar la solicitud."
                : canAcceptVideo
                  ? "Pago con tarjeta recibido. Acepta para que el alumno pueda subir el material."
                  : "Solicitud de video corrección pendiente."
              : awaitsOnlinePayment
                ? "Solicitud desde la web — el alumno aún no ha pagado (debe pulsar «Confirmar y pagar» y terminar en Stripe). Cuando el pago aparezca aquí, podrás aceptar la reserva."
                : canAcceptSession
                  ? booking.payment.status === "deposit_paid"
                    ? `Pago con tarjeta recibido (señal ${BOOKING_DEPOSIT_PERCENT}%). Acepta la reserva para bloquear el calendario; el resto en ${BOOKING_BALANCE_ON_SLOPE}.`
                    : "Pago con tarjeta recibido. Acepta la reserva para bloquear el calendario y avisar al alumno."
                  : "Nueva solicitud — acepta para bloquear el calendario y avisar al alumno (o rechaza)."}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
            {(canAcceptSession || canAcceptVideo) && (
              <button
                type="button"
                disabled={confirming || rejecting}
                onClick={confirmRequest}
                className="min-h-11 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white active:bg-emerald-500 disabled:opacity-50"
              >
                {confirming
                  ? "Aceptando…"
                  : isVideo
                    ? "Aceptar corrección"
                    : "Aceptar reserva"}
              </button>
            )}
            {!isVideo && !awaitsOnlinePayment && !canAcceptSession && (
              <button
                type="button"
                disabled={confirming || rejecting}
                onClick={confirmRequest}
                className="min-h-11 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white active:bg-emerald-500 disabled:opacity-50"
              >
                {confirming ? "Confirmando…" : "Confirmar reserva"}
              </button>
            )}
            <button
              type="button"
              disabled={confirming || rejecting}
              onClick={rejectRequest}
              className="min-h-11 rounded-full border border-zinc-600 px-5 py-2.5 text-sm text-zinc-300 active:border-zinc-500 disabled:opacity-50"
            >
              {rejecting ? "…" : "Rechazar"}
            </button>
          </div>
        </div>
      )}

      {actionError && (
        <p className="mt-2 text-sm text-red-300">{actionError}</p>
      )}

      {booking.payment.status === "pending" && booking.status === "confirmed" && (
        <button
          type="button"
          disabled={markingPaid}
          onClick={markAsPaid}
          className="mt-4 rounded-full border border-emerald-600/50 px-4 py-1.5 text-sm text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
        >
          {markingPaid ? "…" : "Marcar como pagado"}
        </button>
      )}

      <BookingInvoiceForm
        booking={booking}
        coachId={coachId}
        onUpdated={onUpdated}
      />
    </article>
  );
}
