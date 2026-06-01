import {
  addDays,
  addMonths,
  endOfMonth,
  isAfter,
  isBefore,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { BOOKING_TIMEZONE } from "@/lib/booking/timezone";

function madridParts(ref: Date): { year: number; month: number; dateKey: string } {
  const year = Number(formatInTimeZone(ref, BOOKING_TIMEZONE, "yyyy"));
  const month = Number(formatInTimeZone(ref, BOOKING_TIMEZONE, "M"));
  const dateKey = formatInTimeZone(ref, BOOKING_TIMEZONE, "yyyy-MM-dd");
  return { year, month, dateKey };
}

/** Temporada en pista: noviembre → junio (año de esquí cruzado). */
export const BOOKING_SEASON_FIRST_MONTH = 11;
export const BOOKING_SEASON_LAST_MONTH = 6;

export function isBookingSeasonMonth(month1to12: number): boolean {
  return month1to12 >= BOOKING_SEASON_FIRST_MONTH || month1to12 <= BOOKING_SEASON_LAST_MONTH;
}

export function isDateInBookingSeason(date: Date): boolean {
  const month = Number(formatInTimeZone(date, BOOKING_TIMEZONE, "M"));
  if (!isBookingSeasonMonth(month)) return false;
  const { start, end } = getBookingSeasonBounds(date);
  const key = formatInTimeZone(date, BOOKING_TIMEZONE, "yyyy-MM-dd");
  return key >= start && key <= end;
}

/** Límites de la temporada activa o próxima según la fecha de referencia. */
export function getBookingSeasonBounds(ref = new Date()): {
  start: string;
  end: string;
} {
  const { month, year } = madridParts(ref);

  if (month >= BOOKING_SEASON_FIRST_MONTH) {
    return {
      start: `${year}-11-01`,
      end: `${year + 1}-06-30`,
    };
  }
  if (month <= BOOKING_SEASON_LAST_MONTH) {
    return {
      start: `${year - 1}-11-01`,
      end: `${year}-06-30`,
    };
  }
  return {
    start: `${year}-11-01`,
    end: `${year + 1}-06-30`,
  };
}

/** Primer día reservable: hoy o inicio de temporada, el que sea posterior. */
export function getBookableRangeStart(ref = new Date()): string {
  const today = madridParts(ref).dateKey;
  const { start } = getBookingSeasonBounds(ref);
  return today > start ? today : start;
}

/** Recorta un rango de consulta a la temporada y a fechas futuras reservables. */
export function clampRangeToSeason(
  requestedStart: string,
  requestedEnd: string,
  ref = new Date(),
): { start: string; end: string } | null {
  const season = getBookingSeasonBounds(ref);
  const bookableStart = getBookableRangeStart(ref);

  const start =
    requestedStart > season.start ? requestedStart : season.start;
  const effectiveStart = start > bookableStart ? start : bookableStart;

  const end = requestedEnd < season.end ? requestedEnd : season.end;

  if (effectiveStart > end) return null;
  return { start: effectiveStart, end };
}

/** Mes inicial del calendario (noviembre si estamos fuera de temporada). */
export function getDefaultCalendarMonth(ref = new Date()): Date {
  const { start } = getBookingSeasonBounds(ref);
  const seasonStart = startOfMonth(parseISO(start));
  const todayMonth = startOfMonth(
    parseISO(madridParts(ref).dateKey),
  );

  if (isDateInBookingSeason(ref) && !isBefore(todayMonth, seasonStart)) {
    return todayMonth;
  }
  return seasonStart;
}

export function isMonthNavigableInSeason(month: Date): boolean {
  return isBookingSeasonMonth(madridParts(month).month);
}

export function canShowPrevSeasonMonth(
  viewMonth: Date,
  bookableStart: Date,
): boolean {
  const prev = subMonths(startOfMonth(viewMonth), 1);
  if (!isMonthNavigableInSeason(prev)) return false;
  return !isBefore(endOfMonth(prev), startOfMonth(bookableStart));
}

export function canShowNextSeasonMonth(
  viewMonth: Date,
  seasonEnd: Date,
): boolean {
  const next = addMonths(startOfMonth(viewMonth), 1);
  if (!isMonthNavigableInSeason(next)) return false;
  return !isAfter(startOfMonth(next), endOfMonth(seasonEnd));
}
