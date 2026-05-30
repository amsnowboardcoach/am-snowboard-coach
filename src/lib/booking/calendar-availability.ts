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
