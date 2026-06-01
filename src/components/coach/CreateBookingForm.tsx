"use client";

import { FormEvent, useState } from "react";
import { LESSON_TYPES, lessonPublicName } from "@/constants/lesson-types";
import {
  SESSION_DURATIONS,
  sessionTotalEuros,
} from "@/constants/session-schedules";
import { createBooking } from "@/lib/firebase/bookings";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/utils/dates";
import type { BookingStatus, PaymentStatus } from "@/types/firestore";

interface CreateBookingFormProps {
  coachId: string;
  onCreated: () => void;
  defaultOpen?: boolean;
}

export function CreateBookingForm({
  coachId,
  onCreated,
  defaultOpen = false,
}: CreateBookingFormProps) {
  const defaultStart = new Date();
  defaultStart.setHours(10, 0, 0, 0);

  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [studentDisplayName, setStudentDisplayName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [lessonTypeId, setLessonTypeId] = useState<string>(LESSON_TYPES[0].id);
  const [startAt, setStartAt] = useState(toDatetimeLocalValue(defaultStart));
  const [sessionId, setSessionId] = useState<string>("2h");
  const [slotId, setSlotId] = useState("10-12");
  const [durationMinutes, setDurationMinutes] = useState(120);

  const activeSession =
    SESSION_DURATIONS.find((s) => s.id === sessionId) ?? SESSION_DURATIONS[0];

  function applySessionPreset(id: string) {
    setSessionId(id);
    const session = SESSION_DURATIONS.find((s) => s.id === id);
    if (session) {
      setDurationMinutes(session.durationMinutes);
      setAmountEuros(String(sessionTotalEuros(session)));
      setSlotId(session.slots[0]?.id ?? "");
      applySlotStart(session.slots[0], session.durationMinutes);
    }
  }

  function applySlotStart(
    slot: { start: string } | undefined,
    minutes: number,
  ) {
    if (!slot) return;
    const [h, m] = slot.start.split(":").map(Number);
    const d = fromDatetimeLocalValue(startAt);
    d.setHours(h, m ?? 0, 0, 0);
    setStartAt(toDatetimeLocalValue(d));
    setDurationMinutes(minutes);
  }
  const [amountEuros, setAmountEuros] = useState(
    String(sessionTotalEuros(SESSION_DURATIONS[0])),
  );
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [status, setStatus] = useState<BookingStatus>("confirmed");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await createBooking({
        coachId,
        studentDisplayName,
        studentEmail: studentEmail || undefined,
        lessonTypeId,
        startAt: fromDatetimeLocalValue(startAt),
        durationMinutes,
        amountEuros: parseFloat(amountEuros.replace(",", ".")) || 0,
        paymentStatus,
        status,
      });
      setStudentDisplayName("");
      setStudentEmail("");
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear reserva");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-400">
          Reservas manuales (teléfono, WhatsApp) con los mismos turnos que la web.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-sky-400"
        >
          + Nueva reserva manual
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
    >
      <h2 className="text-lg font-semibold">Nueva reserva</h2>
      <p className="mt-1 text-sm text-zinc-500">
        No sustituye la reserva online; úsala para casos puntuales.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-zinc-300">
          Nombre del alumno *
          <input
            required
            value={studentDisplayName}
            onChange={(e) => setStudentDisplayName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          />
        </label>
        <label className="block text-sm text-zinc-300">
          Email (opcional)
          <input
            type="email"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          />
        </label>
        <label className="block text-sm text-zinc-300">
          Tipo de clase
          <select
            value={lessonTypeId}
            onChange={(e) => setLessonTypeId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          >
            {LESSON_TYPES.map((l) => (
              <option key={l.id} value={l.id}>
                {lessonPublicName(l)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm text-zinc-300 sm:col-span-2">
          Duración en pista
          <select
            value={sessionId}
            onChange={(e) => applySessionPreset(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          >
            {SESSION_DURATIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {sessionTotalEuros(s)} € ({s.pricePerHourEuros} €/h)
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2">
          <p className="text-sm text-zinc-300">Turno</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {activeSession.slots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => {
                  setSlotId(slot.id);
                  applySlotStart(slot, activeSession.durationMinutes);
                }}
                className={`rounded-full border px-4 py-2 text-sm ${
                  slotId === slot.id
                    ? "border-sky-500 bg-sky-500/20 text-sky-200"
                    : "border-zinc-700 text-zinc-400"
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-sm text-zinc-300 sm:col-span-2">
          Día y hora de inicio
          <input
            type="datetime-local"
            required
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          />
        </label>
        <label className="block text-sm text-zinc-300">
          Importe (€)
          <input
            required
            value={amountEuros}
            onChange={(e) => setAmountEuros(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          />
        </label>
        <label className="block text-sm text-zinc-300">
          Pago
          <select
            value={paymentStatus}
            onChange={(e) =>
              setPaymentStatus(e.target.value as PaymentStatus)
            }
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          >
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
          </select>
        </label>
        <label className="block text-sm text-zinc-300">
          Estado reserva
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BookingStatus)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          >
            <option value="confirmed">Confirmada</option>
            <option value="pending">Pendiente</option>
            <option value="completed">Completada</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </label>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
        >
          {loading ? "Guardando…" : "Crear reserva"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-zinc-700 px-5 py-2 text-sm text-zinc-400"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
