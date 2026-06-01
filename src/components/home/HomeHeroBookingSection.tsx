"use client";

import { useRouter } from "next/navigation";
import {
  addDays,
  endOfMonth,
  format,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookingAvailabilityCalendar } from "@/components/booking/BookingAvailabilityCalendar";
import { BOOKING_PAYMENT_OPTIONS } from "@/constants/booking-payment";
import {
  formatDaysPlanLabel,
  inferDaysPlanFromDates,
  MAX_BOOKING_DAYS,
} from "@/constants/booking-plan";
import { LESSON_TYPES } from "@/constants/lesson-types";
import { BOOKING_AVAILABILITY_FETCH_DAYS } from "@/constants/booking-availability";
import {
  DEFAULT_SESSION_DURATION_ID,
  getSessionDuration,
} from "@/constants/session-schedules";
import type { AvailableSlotOption } from "@/lib/booking/availability";
import {
  saveBookingDraft,
  type BookingDraftSlot,
} from "@/lib/booking/booking-draft";
import {
  countDaysWithFreeSlots,
  mergeAvailableSlots,
  mergeCalendarDays,
  slotsFreeOnAllPickedDates,
  type CalendarDayInfo,
} from "@/lib/booking/calendar-availability";
import { isDaySelectionComplete } from "@/lib/booking/multi-day";
import { formatSlotConflictMessage } from "@/lib/booking/slot-suggestions";
import type { DurationAvailabilityStatus } from "@/lib/booking/duration-availability";
import { reservarHref } from "@/lib/booking/reservar-url";
import {
  clampRangeToSeason,
  getBookableRangeStart,
  getBookingSeasonBounds,
} from "@/lib/booking/season";
import { cn } from "@/lib/utils/cn";

function defaultAvailabilityFetchRange(): { start: string; end: string } {
  const season = getBookingSeasonBounds();
  const start = getBookableRangeStart();
  const tentativeEnd = format(
    addDays(parseISO(start), BOOKING_AVAILABILITY_FETCH_DAYS),
    "yyyy-MM-dd",
  );
  const end = tentativeEnd < season.end ? tentativeEnd : season.end;
  return { start, end };
}

export function HomeHeroBookingSection() {
  const router = useRouter();
  const durationId = DEFAULT_SESSION_DURATION_ID;
  const session = getSessionDuration(durationId)!;

  const [calendarDays, setCalendarDays] = useState<CalendarDayInfo[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlotOption[]>(
    [],
  );
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [loadStatus, setLoadStatus] =
    useState<DurationAvailabilityStatus>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pickedDateKeys, setPickedDateKeys] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<BookingDraftSlot[]>([]);
  const [slotError, setSlotError] = useState<string | null>(null);

  const fetchRef = useRef<string | null>(null);
  const genRef = useRef(0);
  const rangeEndRef = useRef("");

  const fetchAvailability = useCallback(
    async (
      range?: { start: string; end: string },
      merge = false,
      force = false,
    ) => {
      const requested = range ?? defaultAvailabilityFetchRange();
      const clamped = clampRangeToSeason(requested.start, requested.end);
      if (!clamped) {
        const season = getBookingSeasonBounds();
        setLoadStatus("empty");
        setCalendarDays([]);
        setAvailableSlots([]);
        setRangeStart(getBookableRangeStart());
        setRangeEnd(season.end);
        rangeEndRef.current = season.end;
        return;
      }
      const { start, end } = clamped;
      const fetchKey = `${start}:${end}:${merge}`;
      if (!force && fetchRef.current === fetchKey) return;
      fetchRef.current = fetchKey;
      const gen = ++genRef.current;

      if (!merge) setLoadStatus("loading");
      setLoadError(null);

      try {
        const params = new URLSearchParams({
          durationId,
          start,
          end,
        });
        const res = await fetch(`/api/bookings/availability?${params}`);
        const data = await res.json();
        if (gen !== genRef.current) return;
        if (!res.ok) throw new Error(data.error ?? "Error de disponibilidad");

        const incomingSlots: AvailableSlotOption[] = data.slots ?? [];
        const incomingDays: CalendarDayInfo[] = data.days ?? [];

        setAvailableSlots((prior) =>
          merge ? mergeAvailableSlots(prior, incomingSlots) : incomingSlots,
        );
        setCalendarDays((prior) => {
          const days = merge
            ? mergeCalendarDays(prior, incomingDays)
            : incomingDays;
          setLoadStatus(
            countDaysWithFreeSlots(days) > 0 ? "ready" : "empty",
          );
          return days;
        });
        setRangeStart((prev) =>
          merge ? prev || data.rangeStart || start : (data.rangeStart ?? start),
        );
        setRangeEnd(end);
        rangeEndRef.current = end;
      } catch (err) {
        if (!merge) {
          setLoadStatus("error");
          setLoadError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el calendario",
          );
          setCalendarDays([]);
          setAvailableSlots([]);
        }
      } finally {
        if (fetchRef.current === fetchKey) fetchRef.current = null;
      }
    },
    [durationId],
  );

  useEffect(() => {
    void fetchAvailability(undefined, false, true);
  }, [fetchAvailability]);

  const navigationRangeEnd = getBookingSeasonBounds().end;

  const refreshCalendar = useCallback(() => {
    const range =
      rangeStart && rangeEnd
        ? { start: rangeStart, end: rangeEnd }
        : defaultAvailabilityFetchRange();
    fetchRef.current = null;
    void fetchAvailability(range, false, true);
  }, [rangeEnd, rangeStart, fetchAvailability]);

  const handleVisibleMonth = useCallback(
    (month: Date) => {
      const loadedEndStr = rangeEndRef.current;
      if (!loadedEndStr) return;

      const loadedEnd = parseISO(loadedEndStr);
      const monthEnd = endOfMonth(month);
      if (monthEnd <= loadedEnd) return;

      const fetchStart = format(addDays(loadedEnd, 1), "yyyy-MM-dd");
      const fetchEnd = format(
        addDays(loadedEnd, BOOKING_AVAILABILITY_FETCH_DAYS),
        "yyyy-MM-dd",
      );
      const clampedEnd =
        fetchEnd < navigationRangeEnd ? fetchEnd : navigationRangeEnd;
      if (fetchStart > clampedEnd) return;
      void fetchAvailability({ start: fetchStart, end: clampedEnd }, true);
    },
    [fetchAvailability, navigationRangeEnd],
  );

  const selectedSlotByDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of selectedDays) map.set(d.date, d.slotId);
    return map;
  }, [selectedDays]);

  function pickDateKey(date: string) {
    setSlotError(null);
    setPickedDateKeys((prev) => {
      const exists = prev.includes(date);
      const next = exists
        ? prev.filter((d) => d !== date)
        : prev.length >= MAX_BOOKING_DAYS
          ? prev
          : [...prev, date].sort();
      setSelectedDays((days) => days.filter((d) => next.includes(d.date)));
      return next;
    });
  }

  function pickSlotForDate(date: string, slotId: string) {
    setSlotError(null);
    const option = availableSlots.find(
      (o) => o.date === date && o.slotId === slotId,
    );
    if (!option) return;
    setSelectedDays((prev) =>
      [
        ...prev.filter((d) => d.date !== date),
        {
          slotId: option.slotId,
          startUtc: option.startUtc,
          date: option.date,
          label: option.label,
        },
      ].sort((a, b) => a.date.localeCompare(b.date)),
    );
  }

  function pickSlotForAllDates(slotId: string) {
    setSlotError(null);
    if (pickedDateKeys.length === 0) {
      setSelectedDays([]);
      return;
    }
    const days = pickedDateKeys
      .map((date) =>
        availableSlots.find((o) => o.date === date && o.slotId === slotId),
      )
      .filter((o): o is AvailableSlotOption => Boolean(o));
    if (days.length !== pickedDateKeys.length) {
      setSlotError(
        formatSlotConflictMessage(
          session.slots,
          slotId,
          pickedDateKeys,
          availableSlots,
          (d) => format(parseISO(d), "d MMM", { locale: es }),
        ),
      );
      return;
    }
    setSelectedDays(
      days.map((o) => ({
        slotId: o.slotId,
        startUtc: o.startUtc,
        date: o.date,
        label: o.label,
      })),
    );
  }

  const datesPickedReady = pickedDateKeys.length >= 1;
  const selectionReady = isDaySelectionComplete(pickedDateKeys, selectedDays);
  const daysPlan = useMemo(
    () => inferDaysPlanFromDates(pickedDateKeys),
    [pickedDateKeys],
  );

  useEffect(() => {
    if (!datesPickedReady || pickedDateKeys.length !== 1 || selectionReady) {
      return;
    }
    const common = slotsFreeOnAllPickedDates(
      session.slots,
      pickedDateKeys,
      availableSlots,
    );
    if (common.length === 1) {
      pickSlotForAllDates(common[0]!.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-único turno (1 día)
  }, [datesPickedReady, pickedDateKeys.length, availableSlots, selectionReady]);

  function goToReservar(withDraft: boolean) {
    if (withDraft && selectionReady) {
      const slotIds = new Set(selectedDays.map((d) => d.slotId));
      saveBookingDraft({
        participantCount: 1,
        daysPlan,
        consecutiveCount: pickedDateKeys.length,
        durationId,
        slotId: slotIds.size === 1 ? selectedDays[0]!.slotId : null,
        pickedDateKeys,
        selectedDays,
        lessonTypeId: LESSON_TYPES[0]!.id,
        paymentOption: BOOKING_PAYMENT_OPTIONS[0]!.id,
      });
      router.push(reservarHref({ duracion: durationId }));
      return;
    }
    router.push("/reservar");
  }

  return (
    <>
      <div className="rounded-2xl border border-white/15 bg-zinc-950/80 p-3 shadow-xl shadow-black/30 backdrop-blur-md sm:p-4">
        <p className="mb-3 text-xs font-medium text-zinc-400">
          Disponibilidad en vivo
        </p>
        <BookingAvailabilityCalendar
          className="border-zinc-700/60 bg-zinc-900/50"
          calendarDays={calendarDays}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          availableSlots={availableSlots}
          sessionSlots={session.slots}
          selectedDates={pickedDateKeys}
          selectedSlotByDate={selectedSlotByDate}
          onSelectDate={pickDateKey}
          onSelectSlotForDate={pickSlotForDate}
          onSelectSlotForAllDates={pickSlotForAllDates}
          loadStatus={loadStatus}
          loadError={loadError}
          onRetry={refreshCalendar}
          onRefresh={refreshCalendar}
          onVisibleMonthChange={handleVisibleMonth}
          navigationRangeEnd={navigationRangeEnd}
          slotSection="when-picked"
          emptySlotHint="Toca uno o varios días verdes o ámbar y elige turno en cada uno."
        />
        {pickedDateKeys.length > 0 && !selectionReady && (
          <p className="mt-3 text-center text-xs text-zinc-500">
            {pickedDateKeys.length === 1
              ? "Elige turno de mañana o tarde."
              : `Elige turno (${selectedDays.length}/${pickedDateKeys.length} días)`}
          </p>
        )}
        {slotError && (
          <p className="mt-2 text-center text-xs text-amber-300/95">{slotError}</p>
        )}
        {selectionReady && (
          <p className="mt-3 text-center text-xs text-emerald-300/90">
            {pickedDateKeys.length === 1 && pickedDateKeys[0] ? (
              <>
                {selectedDays[0]?.label} ·{" "}
                {format(parseISO(pickedDateKeys[0]), "EEEE d MMMM", {
                  locale: es,
                })}
              </>
            ) : (
              <>
                {formatDaysPlanLabel(daysPlan, pickedDateKeys.length)} ·{" "}
                {pickedDateKeys
                  .map((d) => format(parseISO(d), "d MMM", { locale: es }))
                  .join(", ")}
              </>
            )}
          </p>
        )}
      </div>

      <div className="mt-4 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => goToReservar(selectionReady)}
          className={cn(
            "flex min-h-12 w-full touch-manipulation items-center justify-center rounded-full bg-sky-500 px-8 py-3.5 text-center font-semibold text-zinc-950 shadow-xl shadow-sky-500/25 transition hover:bg-sky-400 active:scale-[0.98] sm:w-auto",
          )}
        >
          {selectionReady
            ? pickedDateKeys.length === 1
              ? "Continuar con este turno"
              : `Continuar con ${pickedDateKeys.length} días`
            : "Reservar mi clase"}
        </button>
      </div>
    </>
  );
}
