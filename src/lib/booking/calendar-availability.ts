import type { AvailableSlotOption } from "@/lib/booking/availability";

export type CalendarDayStatus = "past" | "full" | "partial" | "available";

export interface CalendarDaySlot {
  slotId: string;
  label: string;
  available: boolean;
}

export interface CalendarDayInfo {
  date: string;
  status: CalendarDayStatus;
  freeCount: number;
  totalCount: number;
  slots: CalendarDaySlot[];
}

export interface BookingCalendarAvailability {
  slots: AvailableSlotOption[];
  days: CalendarDayInfo[];
  rangeStart: string;
  rangeEnd: string;
}

export function countDaysWithFreeSlots(days: CalendarDayInfo[]): number {
  return days.filter((d) => d.freeCount > 0).length;
}

/** Combina días al ampliar el rango cargado (sin duplicar fechas). */
export function mergeCalendarDays(
  existing: CalendarDayInfo[],
  incoming: CalendarDayInfo[],
): CalendarDayInfo[] {
  const byDate = new Map(existing.map((d) => [d.date, d]));
  for (const day of incoming) {
    byDate.set(day.date, day);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function mergeAvailableSlots(
  existing: AvailableSlotOption[],
  incoming: AvailableSlotOption[],
): AvailableSlotOption[] {
  const key = (o: AvailableSlotOption) => `${o.date}|${o.slotId}|${o.startUtc}`;
  const map = new Map(existing.map((o) => [key(o), o]));
  for (const slot of incoming) {
    map.set(key(slot), slot);
  }
  return [...map.values()].sort(
    (a, b) => a.startUtc.localeCompare(b.startUtc) || a.slotId.localeCompare(b.slotId),
  );
}

/** Turnos libres en todos los días elegidos (mismo criterio que el formulario) */
export function slotsFreeOnAllPickedDates(
  sessionSlotIds: { id: string; label: string }[],
  pickedDates: string[],
  availableSlots: AvailableSlotOption[],
): { id: string; label: string }[] {
  if (pickedDates.length === 0) return [];
  return sessionSlotIds.filter((slot) =>
    pickedDates.every((date) =>
      availableSlots.some((o) => o.date === date && o.slotId === slot.id),
    ),
  );
}
