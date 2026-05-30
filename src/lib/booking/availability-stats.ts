import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { AvailableSlotOption } from "@/lib/booking/availability";

export function countAvailableDays(slots: AvailableSlotOption[]): number {
  return new Set(slots.map((s) => s.date)).size;
}

export function firstAvailableDateKey(
  slots: AvailableSlotOption[],
): string | null {
  const dates = [...new Set(slots.map((s) => s.date))].sort();
  return dates[0] ?? null;
}

export function formatFirstAvailableLabel(
  dateKey: string | null,
): string | null {
  if (!dateKey) return null;
  return format(parseISO(dateKey), "EEE d MMM", { locale: es });
}
