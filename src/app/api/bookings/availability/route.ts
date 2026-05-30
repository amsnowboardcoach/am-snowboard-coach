import { NextRequest, NextResponse } from "next/server";
import {
  getSessionDuration,
  type SessionDurationId,
} from "@/constants/session-schedules";
import { getBookingCalendarAvailability } from "@/lib/booking/schedule";
import { isGoogleCalendarConfigured } from "@/lib/google/calendar";
import { BOOKING_AVAILABILITY_LOOKAHEAD_DAYS } from "@/constants/booking-availability";
import { addDays, format } from "date-fns";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const durationId = searchParams.get("durationId") as SessionDurationId | null;
  const slotId = searchParams.get("slotId") ?? undefined;
  const start =
    searchParams.get("start") ?? format(new Date(), "yyyy-MM-dd");
  const end =
    searchParams.get("end") ??
    format(addDays(new Date(), BOOKING_AVAILABILITY_LOOKAHEAD_DAYS), "yyyy-MM-dd");

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

  try {
    const calendar = await getBookingCalendarAvailability(
      session,
      start,
      end,
      slotId,
    );

    return NextResponse.json({
      durationId,
      slotId: slotId ?? null,
      start,
      end,
      slots: calendar.slots,
      days: calendar.days,
      rangeStart: calendar.rangeStart,
      rangeEnd: calendar.rangeEnd,
    });
  } catch (err) {
    console.error("[availability]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudo consultar disponibilidad",
      },
      { status: 502 },
    );
  }
}
