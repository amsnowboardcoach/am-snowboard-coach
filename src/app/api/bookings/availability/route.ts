import { NextRequest, NextResponse } from "next/server";
import {
  getSessionDuration,
  type SessionDurationId,
} from "@/constants/session-schedules";
import { getBookingCalendarAvailability } from "@/lib/booking/schedule";
import { isGoogleCalendarConfigured } from "@/lib/google/calendar";
import { BOOKING_AVAILABILITY_FETCH_DAYS } from "@/constants/booking-availability";
import {
  clampRangeToSeason,
  getBookableRangeStart,
  getBookingSeasonBounds,
} from "@/lib/booking/season";
import { addDays, format, parseISO } from "date-fns";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const durationId = searchParams.get("durationId") as SessionDurationId | null;
  const slotId = searchParams.get("slotId") ?? undefined;
  const season = getBookingSeasonBounds();
  const defaultStart = getBookableRangeStart();
  const tentativeEnd = format(
    addDays(parseISO(defaultStart), BOOKING_AVAILABILITY_FETCH_DAYS),
    "yyyy-MM-dd",
  );
  const defaultEnd = tentativeEnd < season.end ? tentativeEnd : season.end;
  const requestedStart = searchParams.get("start") ?? defaultStart;
  const requestedEnd = searchParams.get("end") ?? defaultEnd;
  const clamped = clampRangeToSeason(requestedStart, requestedEnd);

  if (!durationId) {
    return NextResponse.json(
      { error: "durationId requerido" },
      { status: 400 },
    );
  }

  const session = getSessionDuration(durationId);
  if (!session) {
    return NextResponse.json({ error: "Duración inválida" }, { status: 400 });
  }

  if (slotId && !session.slots.some((s) => s.id === slotId)) {
    return NextResponse.json({ error: "Turno inválido" }, { status: 400 });
  }

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      {
        error:
          "Calendario no configurado. Añade GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REFRESH_TOKEN.",
      },
      { status: 503 },
    );
  }

  if (!clamped) {
    return NextResponse.json({
      durationId,
      slotId: slotId ?? null,
      start: defaultStart,
      end: season.end,
      slots: [],
      days: [],
      rangeStart: defaultStart,
      rangeEnd: season.end,
    });
  }

  const { start, end } = clamped;

  try {
    const calendar = await getBookingCalendarAvailability(
      session,
      start,
      end,
      slotId,
    );

    const warnings: string[] = [];
    if (!isGoogleCalendarConfigured()) {
      warnings.push("Calendario de Google no configurado en el servidor.");
    }

    return NextResponse.json({
      durationId,
      slotId: slotId ?? null,
      start,
      end,
      slots: calendar.slots,
      days: calendar.days,
      rangeStart: getBookableRangeStart(),
      rangeEnd: season.end,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (err) {
    console.error("[availability]", err);
    const message =
      err instanceof Error ? err.message : "No se pudo consultar disponibilidad";
    return NextResponse.json(
      {
        error: message,
        durationId,
        slotId: slotId ?? null,
        start: clamped.start,
        end: clamped.end,
        slots: [],
        days: [],
        rangeStart: getBookableRangeStart(),
        rangeEnd: season.end,
      },
      { status: 200 },
    );
  }
}
