import { addDays, format, parseISO } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import type { SessionDuration, SessionTimeSlot } from "@/constants/session-schedules";
import { MIN_BOOKING_NOTICE_HOURS } from "@/constants/project";
import { BOOKING_TIMEZONE } from "@/lib/booking/timezone";
import type { AvailableSlotOption } from "@/lib/booking/availability";

/** Convierte fecha YYYY-MM-DD + HH:mm (Madrid) a Date UTC */
export function slotToUtcRange(
  dateStr: string,
  slot: SessionTimeSlot,
  durationMinutes: number,
): { startUtc: string; endUtc: string; start: Date; end: Date } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [sh, sm] = slot.start.split(":").map(Number);
  const startLocal = fromZonedTime(
    new Date(y, m - 1, d, sh, sm ?? 0, 0, 0),
    BOOKING_TIMEZONE,
  );
  const end = new Date(startLocal.getTime() + durationMinutes * 60 * 1000);
  return {
    start: startLocal,
    end,
    startUtc: startLocal.toISOString(),
    endUtc: end.toISOString(),
  };
}

/** Genera candidatos de turno para un rango de fechas */
export function buildSlotCandidates(
  session: SessionDuration,
  startDate: string,
  endDate: string,
  slotId?: string,
): AvailableSlotOption[] {
  const slots = slotId
    ? session.slots.filter((s) => s.id === slotId)
    : session.slots;

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const now = Date.now();
  const minStart = now + MIN_BOOKING_NOTICE_HOURS * 60 * 60 * 1000;

  const options: AvailableSlotOption[] = [];
  let cursor = start;

  while (cursor <= end) {
    const dateStr = format(cursor, "yyyy-MM-dd");
    for (const slot of slots) {
      const range = slotToUtcRange(dateStr, slot, session.durationMinutes);
      if (range.start.getTime() >= minStart) {
        options.push({
          date: dateStr,
          slotId: slot.id,
          label: slot.label,
          startUtc: range.startUtc,
          endUtc: range.endUtc,
        });
      }
    }
    cursor = addDays(cursor, 1);
  }

  return options;
}
