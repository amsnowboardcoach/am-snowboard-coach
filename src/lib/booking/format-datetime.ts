import { formatInTimeZone } from "date-fns-tz";
import { es } from "date-fns/locale";
import { BOOKING_TIMEZONE } from "@/lib/booking/timezone";

type FormatOpts = { locale?: typeof es };

/** Fecha/hora de reserva siempre en Europe/Madrid (pista Sierra Nevada). */
export function formatBookingInTimeZone(
  date: Date,
  pattern: string,
  options?: FormatOpts,
): string {
  return formatInTimeZone(date, BOOKING_TIMEZONE, pattern, {
    locale: es,
    ...options,
  });
}

/** Ej. «viernes 6 junio 2026, 10:00 – 12:00 (hora peninsular)» */
export function formatBookingWhen(start: Date, end: Date): string {
  const day = formatBookingInTimeZone(start, "EEEE d MMMM yyyy");
  const time = `${formatBookingInTimeZone(start, "HH:mm")} – ${formatBookingInTimeZone(end, "HH:mm")}`;
  return `${day}, ${time} (hora peninsular)`;
}

/** Para Google Calendar API: dateTime local sin offset Z */
export function toCalendarDateTimeLocal(date: Date): string {
  return formatInTimeZone(date, BOOKING_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss");
}
