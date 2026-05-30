import { formatInTimeZone } from "date-fns-tz";
import type { SessionDuration, SessionTimeSlot } from "@/constants/session-schedules";
import { BOOKING_TIMEZONE } from "@/lib/booking/timezone";

export interface CalSlotRange {
  start: string;
  end: string;
}

export interface AvailableSlotOption {
  date: string;
  slotId: string;
  label: string;
  startUtc: string;
  endUtc: string;
}

/** Hora local HH:mm desde ISO de Cal.com */
export function localStartTime(isoStart: string): string {
  return formatInTimeZone(new Date(isoStart), BOOKING_TIMEZONE, "HH:mm");
}

function rangeMatchesSlot(range: CalSlotRange, slot: SessionTimeSlot): boolean {
  return localStartTime(range.start) === slot.start;
}

/** Filtra respuesta Cal.com a los turnos fijos del negocio */
export function mapCalSlotsToFixedSlots(
  calByDate: Record<string, CalSlotRange[] | undefined>,
  session: SessionDuration,
  slotId?: string,
): AvailableSlotOption[] {
  const slots = slotId
    ? session.slots.filter((s) => s.id === slotId)
    : session.slots;

  const options: AvailableSlotOption[] = [];

  for (const [date, ranges] of Object.entries(calByDate)) {
    if (!ranges?.length) continue;
    for (const slot of slots) {
      const match = ranges.find((r) => rangeMatchesSlot(r, slot));
      if (match) {
        options.push({
          date,
          slotId: slot.id,
          label: slot.label,
          startUtc: match.start,
          endUtc: match.end,
        });
      }
    }
  }

  return options.sort((a, b) => a.date.localeCompare(b.date));
}

/** Fechas con al menos un turno libre (para un slot concreto) */
export function datesForSlot(
  options: AvailableSlotOption[],
  slotId: string,
): string[] {
  return [...new Set(options.filter((o) => o.slotId === slotId).map((o) => o.date))];
}
