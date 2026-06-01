import { addDays, format, parseISO } from "date-fns";
import type { AvailableSlotOption } from "@/lib/booking/availability";
import type { BookingDaysPlan } from "@/constants/booking-plan";

/** Opciones del mismo turno indexadas por yyyy-MM-dd */
export function availabilityByDate(
  options: AvailableSlotOption[],
  slotId: string,
): Map<string, AvailableSlotOption> {
  const map = new Map<string, AvailableSlotOption>();
  for (const o of options) {
    if (o.slotId === slotId) map.set(o.date, o);
  }
  return map;
}

/** Pack de N días consecutivos desde la fecha de inicio */
export function buildConsecutivePack(
  options: AvailableSlotOption[],
  slotId: string,
  start: AvailableSlotOption,
  count: number,
): AvailableSlotOption[] | null {
  if (count < 1) return null;
  const byDate = availabilityByDate(options, slotId);
  const pack: AvailableSlotOption[] = [start];
  let cursor = parseISO(start.date);
  for (let i = 1; i < count; i++) {
    cursor = addDays(cursor, 1);
    const key = format(cursor, "yyyy-MM-dd");
    const next = byDate.get(key);
    if (!next) return null;
    pack.push(next);
  }
  return pack;
}

export function requiredDayCount(
  plan: BookingDaysPlan,
  consecutiveCount: number,
): number {
  if (plan === "single") return 1;
  if (plan === "consecutive") return consecutiveCount;
  return 0;
}

export function isDaySelectionComplete(
  pickedDateKeys: string[],
  selected: readonly { date: string }[],
): boolean {
  return (
    pickedDateKeys.length >= 1 && selected.length === pickedDateKeys.length
  );
}
