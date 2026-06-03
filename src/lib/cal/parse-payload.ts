import {
  getSessionByCalSlug,
  sessionTotalCents,
} from "@/constants/session-schedules";
import type { SessionDurationId } from "@/constants/session-schedules";
import type { BookingStatus } from "@/types/firestore";
import type { CalBookingPayload, CalTriggerEvent } from "@/lib/cal/types";

export interface ParsedCalBooking {
  calUid: string;
  calBookingId?: number;
  calEventTypeSlug: string;
  sessionDurationId: SessionDurationId | null;
  lessonTypeId: string;
  lessonTypeName: string;
  alumnoDisplayName: string;
  alumnoEmail: string;
  startAt: Date;
  endAt: Date;
  status: BookingStatus;
  amountCents: number;
  notes?: string;
}

function primaryAttendee(payload: CalBookingPayload) {
  const a = payload.attendees?.[0];
  const name =
    a?.name ??
    payload.responses?.name?.value ??
    "Alumno";
  const email =
    (a?.email ?? payload.responses?.email?.value ?? "").trim().toLowerCase();
  return { name: String(name).trim(), email };
}

function resolveStatus(
  trigger: CalTriggerEvent,
  payload: CalBookingPayload,
): BookingStatus {
  if (trigger === "BOOKING_CANCELLED" || trigger === "BOOKING_REJECTED") {
    return "cancelled";
  }
  const s = (payload.status ?? "").toLowerCase();
  if (s === "cancelled" || s === "rejected") return "cancelled";
  if (
    payload.requiresConfirmation &&
    (s === "pending" || trigger === "BOOKING_REQUESTED")
  ) {
    return "pending";
  }
  return "confirmed";
}

function resolveAmountCents(payload: CalBookingPayload): number {
  const price = payload.price ?? 0;
  const currency = (payload.currency ?? "").toLowerCase();
  if (price <= 0) return 0;
  if (currency === "eur") return Math.round(price);
  return 0;
}

export function parseCalBookingPayload(
  trigger: CalTriggerEvent,
  payload: CalBookingPayload,
): ParsedCalBooking | null {
  const calUid = payload.uid?.trim();
  const startTime = payload.startTime;
  const endTime = payload.endTime;
  if (!calUid || !startTime || !endTime) {
    return null;
  }

  const startAt = new Date(startTime);
  const endAt = new Date(endTime);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    return null;
  }

  const slug = (payload.type ?? "").trim();
  const session = slug ? getSessionByCalSlug(slug) : undefined;
  const { name, email } = primaryAttendee(payload);

  const lessonTypeName =
    session?.name ??
    payload.eventTitle ??
    payload.title ??
    "Clase snowboard";

  return {
    calUid,
    calBookingId: payload.bookingId,
    calEventTypeSlug: slug,
    sessionDurationId: session?.id ?? null,
    lessonTypeId: session?.id ?? "reserva-cal",
    lessonTypeName,
    alumnoDisplayName: name,
    alumnoEmail: email,
    startAt,
    endAt,
    status: resolveStatus(trigger, payload),
    amountCents: session
      ? sessionTotalCents(session)
      : resolveAmountCents(payload),
    notes:
      payload.additionalNotes?.trim() ||
      payload.responses?.notes?.value?.trim() ||
      undefined,
  };
}
