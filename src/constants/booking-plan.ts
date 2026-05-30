import { differenceInCalendarDays, parseISO } from "date-fns";

export type BookingDaysPlan = "single" | "consecutive" | "spread";

export const MAX_BOOKING_DAYS = 5;

/** Deduce el plan según las fechas elegidas en el calendario */
export function inferDaysPlanFromDates(dateKeys: string[]): BookingDaysPlan {
  if (dateKeys.length <= 1) return "single";
  const sorted = [...dateKeys].sort();
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseISO(sorted[i - 1]!);
    const next = parseISO(sorted[i]!);
    if (differenceInCalendarDays(next, prev) !== 1) {
      return "spread";
    }
  }
  return "consecutive";
}

export const BOOKING_DAYS_PLAN_OPTIONS: {
  id: BookingDaysPlan;
  label: string;
  hint: string;
}[] = [
  {
    id: "single",
    label: "1 día",
    hint: "Una clase en la fecha que elijas",
  },
  {
    id: "consecutive",
    label: "Días seguidos",
    hint: "Mismo turno varios días seguidos (ej. fin de semana)",
  },
  {
    id: "spread",
    label: "Días sueltos",
    hint: "Varias fechas que no tienen que ser seguidas",
  },
];

export function formatDaysPlanLabel(plan: BookingDaysPlan, dayCount: number): string {
  if (plan === "single") return "1 día";
  if (plan === "consecutive") return `${dayCount} días seguidos`;
  return `${dayCount} días sueltos`;
}
