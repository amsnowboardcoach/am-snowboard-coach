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

const DAY_STATUS_RANK: Record<CalendarDayStatus, number> = {
  available: 3,
  partial: 2,
  full: 1,
  past: 0,
};

/** Vista home: el mejor estado entre 2 h, 3 h y día completo (ocupación en vivo). */
export function mergeCalendarDaysAcrossDurations(
  ...sets: CalendarDayInfo[][]
): CalendarDayInfo[] {
  const byDate = new Map<string, CalendarDayInfo[]>();
  for (const set of sets) {
    for (const day of set) {
      const list = byDate.get(day.date) ?? [];
      list.push(day);
      byDate.set(day.date, list);
    }
  }
  return [...byDate.entries()]
    .map(([date, days]) => {
      const template = days.reduce((best, d) =>
        DAY_STATUS_RANK[d.status] > DAY_STATUS_RANK[best.status] ? d : best,
      );
      const bookable = days.filter(
        (d) => d.freeCount > 0 && d.slots.some((s) => s.available),
      );
      if (bookable.length === 0) {
        return {
          ...template,
          date,
          status: "full" as CalendarDayStatus,
          freeCount: 0,
          totalCount: Math.max(...days.map((d) => d.totalCount), 0),
          slots: template.slots,
        };
      }
      const best = bookable.reduce((a, b) =>
        DAY_STATUS_RANK[a.status] > DAY_STATUS_RANK[b.status] ? a : b,
      );
      const freeCount = Math.max(...bookable.map((d) => d.freeCount));
      const totalCount = best.totalCount;
      let status: CalendarDayStatus = best.status;
      if (freeCount <= 0) status = "full";
      else if (freeCount >= totalCount) status = "available";
      else status = "partial";
      return { ...best, date, freeCount, totalCount, status };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
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
