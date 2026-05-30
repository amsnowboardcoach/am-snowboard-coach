import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import type { Timestamp } from "firebase/firestore";
import { BOOKING_TIMEZONE } from "@/lib/booking/timezone";

export function formatFirestoreDate(
  ts: Timestamp | undefined,
  pattern = "d MMM yyyy, HH:mm",
): string {
  if (!ts) return "—";
  return formatInTimeZone(ts.toDate(), BOOKING_TIMEZONE, pattern, { locale: es });
}

export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): Date {
  return new Date(value);
}
