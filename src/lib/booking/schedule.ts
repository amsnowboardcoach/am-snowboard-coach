import { addDays, format, parseISO } from "date-fns";
import type { SessionDuration } from "@/constants/session-schedules";
import type { AvailableSlotOption } from "@/lib/booking/availability";
import type {
  BookingCalendarAvailability,
  CalendarDayInfo,
  CalendarDaySlot,
} from "@/lib/booking/calendar-availability";
import { buildSlotCandidates } from "@/lib/booking/slot-instances";
import {
  fetchBusyIntervals,
  isGoogleCalendarConfigured,
  isIntervalFree,
} from "@/lib/google/calendar";
import { findOverlappingBookings } from "@/lib/firebase/bookings-admin";
function isSlotFree(
  option: AvailableSlotOption,
  busy: { start: Date; end: Date }[],
  firestoreBusy: Awaited<ReturnType<typeof findOverlappingBookings>>,
): boolean {
  const start = new Date(option.startUtc);
  const end = new Date(option.endUtc);
  const freeCal =
    !isGoogleCalendarConfigured() || isIntervalFree(start, end, busy);
  const freeDb = !firestoreBusy.some((b) =>
    overlaps(start, end, b.startAt.toDate(), b.endAt.toDate()),
  );
  return freeCal && freeDb;
}

export async function getBookingCalendarAvailability(
  session: SessionDuration,
  startDate: string,
  endDate: string,
  slotId?: string,
): Promise<BookingCalendarAvailability> {
  const candidates = buildSlotCandidates(
    session,
    startDate,
    endDate,
    slotId,
  );

  const rangeStart = parseISO(startDate);
  const rangeEndInclusive = parseISO(endDate);
  const rangeEndExclusive = addDays(rangeEndInclusive, 1);

  let busy: { start: Date; end: Date }[] = [];
  if (isGoogleCalendarConfigured() && candidates.length > 0) {
    try {
      busy = await fetchBusyIntervals(rangeStart, rangeEndExclusive);
    } catch (err) {
      console.error("[schedule] Google Calendar busy:", err);
      throw err;
    }
  }

  const firestoreBusy = await findOverlappingBookings(
    rangeStart,
    rangeEndExclusive,
  );

  const slotsByDate = new Map<
    string,
    { option: AvailableSlotOption; available: boolean }[]
  >();

  const available: AvailableSlotOption[] = [];

  for (const option of candidates) {
    const availableSlot = isSlotFree(option, busy, firestoreBusy);
    const list = slotsByDate.get(option.date) ?? [];
    list.push({ option, available: availableSlot });
    slotsByDate.set(option.date, list);
    if (availableSlot) {
      available.push(option);
    }
  }

  const days: CalendarDayInfo[] = [];
  let cursor = rangeStart;

  while (cursor <= rangeEndInclusive) {
    const dateStr = format(cursor, "yyyy-MM-dd");
    const entries = slotsByDate.get(dateStr) ?? [];

    if (entries.length === 0) {
      days.push({
        date: dateStr,
        status: "past",
        freeCount: 0,
        totalCount: 0,
        slots: [],
      });
    } else {
      const slots: CalendarDaySlot[] = entries.map((e) => ({
        slotId: e.option.slotId,
        label: e.option.label,
        available: e.available,
      }));
      const freeCount = slots.filter((s) => s.available).length;
      const totalCount = slots.length;
      let status: CalendarDayInfo["status"];
      if (freeCount === 0) status = "full";
      else if (freeCount === totalCount) status = "available";
      else status = "partial";

      days.push({
        date: dateStr,
        status,
        freeCount,
        totalCount,
        slots,
      });
    }

    cursor = addDays(cursor, 1);
  }

  return {
    slots: available,
    days,
    rangeStart: startDate,
    rangeEnd: endDate,
  };
}

export async function getAvailableSlots(
  session: SessionDuration,
  startDate: string,
  endDate: string,
  slotId?: string,
): Promise<AvailableSlotOption[]> {
  const { slots } = await getBookingCalendarAvailability(
    session,
    startDate,
    endDate,
    slotId,
  );
  return slots;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}
