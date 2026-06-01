"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { MAX_BOOKING_DAYS } from "@/constants/booking-plan";
import type { SessionTimeSlot } from "@/constants/session-schedules";
import type { CalendarDayInfo } from "@/lib/booking/calendar-availability";
import type { CalendarDayStatus } from "@/lib/booking/calendar-availability";
import type { AvailableSlotOption } from "@/lib/booking/availability";
import { freeSlotIdsForDate, nearestFreeSlotId } from "@/lib/booking/slot-suggestions";
import { BOOKING_SEASON_LABEL } from "@/constants/booking-availability";
import { BOOKING_AVAILABILITY_FETCH_DAYS } from "@/constants/booking-availability";
import {
  canShowNextSeasonMonth,
  canShowPrevSeasonMonth,
  getDefaultCalendarMonth,
  isDateInBookingSeason,
} from "@/lib/booking/season";
import type { DurationAvailabilityStatus } from "@/lib/booking/duration-availability";
import { cn } from "@/lib/utils/cn";

function formatShortDate(dateKey: string): string {
  return format(parseISO(dateKey), "d MMM", { locale: es });
}

function SlotAlternativeButton({
  label,
  onSelect,
  className,
}: {
  label: string;
  onSelect: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "mt-2 w-full rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-left text-xs text-amber-100 transition hover:border-amber-500/60 hover:bg-amber-500/15",
        className,
      )}
    >
      <span className="font-medium text-amber-200">Más cercano libre:</span>{" "}
      {label}
    </button>
  );
}

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function parseDateKeyOrFallback(iso: string | undefined, fallback: Date): Date {
  if (!iso?.trim()) return fallback;
  const d = parseISO(iso);
  return isValid(d) ? d : fallback;
}

const LEGEND: { status: CalendarDayStatus; label: string; className: string }[] =
  [
    {
      status: "available",
      label: "Libre",
      className: "bg-emerald-500/25 ring-1 ring-emerald-500/50",
    },
    {
      status: "partial",
      label: "Quedan turnos",
      className: "bg-amber-500/20 ring-1 ring-amber-500/45",
    },
    {
      status: "full",
      label: "Completo",
      className: "bg-red-500/15 ring-1 ring-red-500/35",
    },
  ];

function monthGrid(month: Date): Date[] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days: Date[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

function dayCellClass(
  status: CalendarDayStatus | undefined,
  selected: boolean,
  inMonth: boolean,
): string {
  if (!inMonth) return "invisible";
  if (selected) return "bg-sky-500 font-semibold text-zinc-950 shadow-sm";
  switch (status) {
    case "available":
      return "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-500/40 hover:bg-emerald-500/30";
    case "partial":
      return "bg-amber-500/15 text-amber-100 ring-1 ring-amber-500/35 hover:bg-amber-500/25";
    case "full":
      return "bg-red-500/10 text-red-300/70 ring-1 ring-red-500/25 cursor-not-allowed";
    default:
      return "bg-zinc-800/40 text-zinc-500 cursor-not-allowed";
  }
}

function DaySlotPicker({
  dateKey,
  sessionSlots,
  calendarDay,
  availableSlots,
  selectedSlotId,
  onSelectSlot,
}: {
  dateKey: string;
  sessionSlots: SessionTimeSlot[];
  calendarDay: CalendarDayInfo | undefined;
  availableSlots: AvailableSlotOption[];
  selectedSlotId: string | null;
  onSelectSlot: (slotId: string) => void;
}) {
  const slots = calendarDay?.slots ?? [];

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {slots.map((slot) => {
        const selected = selectedSlotId === slot.slotId;
        const free = slot.available;
        const nearestId = !free
          ? nearestFreeSlotId(
              sessionSlots,
              slot.slotId,
              freeSlotIdsForDate(dateKey, availableSlots),
            )
          : null;
        const nearestLabel = nearestId
          ? sessionSlots.find((s) => s.id === nearestId)?.label
          : null;

        return (
          <li key={slot.slotId}>
            <button
              type="button"
              disabled={!free}
              onClick={() => free && onSelectSlot(slot.slotId)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                free &&
                  !selected &&
                  "border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:border-emerald-500/60",
                free &&
                  selected &&
                  "border-sky-500 bg-sky-500/20 text-sky-100 ring-1 ring-sky-500/50",
                !free &&
                  "cursor-default border-zinc-800 bg-zinc-900/60 text-zinc-500",
              )}
            >
              <span className="font-medium">{slot.label}</span>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                  free
                    ? "bg-emerald-500/25 text-emerald-300"
                    : "bg-zinc-800 text-zinc-500",
                )}
              >
                {free ? "Libre" : "Ocupado"}
              </span>
            </button>
            {!free && nearestId && nearestLabel && (
              <SlotAlternativeButton
                label={nearestLabel}
                onSelect={() => onSelectSlot(nearestId)}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function BookingSlotSeatMap({
  sessionSlots,
  pickedDates,
  calendarDays,
  availableSlots,
  selectedSlotByDate,
  onSelectSlotForDate,
}: {
  sessionSlots: SessionTimeSlot[];
  pickedDates: string[];
  calendarDays: CalendarDayInfo[];
  availableSlots: AvailableSlotOption[];
  selectedSlotByDate: Map<string, string>;
  onSelectSlotForDate: (date: string, slotId: string) => void;
}) {
  const dayMap = useMemo(
    () => new Map(calendarDays.map((d) => [d.date, d])),
    [calendarDays],
  );

  if (pickedDates.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-700/80 px-4 py-6 text-center text-sm text-zinc-500">
        Elige día(s) arriba para ver turnos.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Turnos en pista
        </p>
        <p className="text-[11px] text-zinc-500">Verde libre · gris ocupado</p>
      </div>

      {pickedDates.map((dateKey) => {
        const dayInfo = dayMap.get(dateKey);
        const freeLabels =
          dayInfo?.slots
            .filter((s) => s.available)
            .map((s) => s.label) ?? [];
        const selectedId = selectedSlotByDate.get(dateKey) ?? null;

        return (
          <div
            key={dateKey}
            className={cn(
              pickedDates.length > 1 &&
                "rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3",
            )}
          >
            {pickedDates.length > 1 && (
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold capitalize text-zinc-200">
                  {format(parseISO(dateKey), "EEE d MMM", { locale: es })}
                </p>
                {freeLabels.length > 0 ? (
                  <p className="text-[11px] text-emerald-300/90">
                    Libres: {freeLabels.join(" · ")}
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-300/90">Sin turnos libres</p>
                )}
              </div>
            )}
            <DaySlotPicker
              dateKey={dateKey}
              sessionSlots={sessionSlots}
              calendarDay={dayInfo}
              availableSlots={availableSlots}
              selectedSlotId={selectedId}
              onSelectSlot={(slotId) => onSelectSlotForDate(dateKey, slotId)}
            />
          </div>
        );
      })}
    </div>
  );
}

export function BookingAvailabilityCalendar({
  calendarDays,
  rangeStart,
  rangeEnd,
  availableSlots,
  sessionSlots,
  selectedDates,
  selectedSlotByDate,
  onSelectDate,
  onSelectSlotForDate,
  onSelectSlotForAllDates,
  loadStatus = "ready",
  loadError,
  onRetry,
  onRefresh,
  onVisibleMonthChange,
  navigationRangeEnd,
  disabled,
  className,
  slotSection = "always",
  emptySlotHint,
}: {
  calendarDays: CalendarDayInfo[];
  rangeStart: string;
  rangeEnd: string;
  availableSlots: AvailableSlotOption[];
  sessionSlots: SessionTimeSlot[];
  selectedDates: string[];
  selectedSlotByDate: Map<string, string>;
  onSelectDate: (dateKey: string) => void;
  onSelectSlotForDate: (date: string, slotId: string) => void;
  onSelectSlotForAllDates: (slotId: string) => void;
  loadStatus?: DurationAvailabilityStatus;
  loadError?: string | null;
  onRetry?: () => void;
  /** Vuelve a consultar Google Calendar + reservas */
  onRefresh?: () => void;
  onVisibleMonthChange?: (month: Date) => void;
  /** Último día navegable (p. ej. hoy + 365); puede ser mayor que rangeEnd cargado */
  navigationRangeEnd?: string;
  disabled?: boolean;
  className?: string;
  slotSection?: "always" | "when-picked";
  emptySlotHint?: string;
}) {
  const showSlotPicker =
    slotSection !== "when-picked" || selectedDates.length > 0;
  const isLoading = loadStatus === "loading";
  const isError = loadStatus === "error";
  const calendarDisabled = disabled || isLoading || isError;
  const dayMap = useMemo(
    () => new Map(calendarDays.map((d) => [d.date, d])),
    [calendarDays],
  );
  const selectedSet = useMemo(() => new Set(selectedDates), [selectedDates]);

  const fallbackMonth = useMemo(() => getDefaultCalendarMonth(), []);

  const rangeStartDate = useMemo(
    () => parseDateKeyOrFallback(rangeStart, fallbackMonth),
    [rangeStart, fallbackMonth],
  );
  const rangeEndDate = useMemo(
    () =>
      parseDateKeyOrFallback(
        rangeEnd,
        addDays(fallbackMonth, BOOKING_AVAILABILITY_FETCH_DAYS),
      ),
    [rangeEnd, fallbackMonth],
  );

  const navigationEndDate = useMemo(
    () => parseDateKeyOrFallback(navigationRangeEnd, endOfMonth(fallbackMonth)),
    [navigationRangeEnd, fallbackMonth],
  );

  const initialMonth = useMemo(() => {
    const firstFree = calendarDays.find((d) => d.freeCount > 0);
    if (firstFree) {
      const d = parseISO(firstFree.date);
      if (isValid(d)) return startOfMonth(d);
    }
    return startOfMonth(rangeStartDate);
  }, [calendarDays, rangeStartDate]);

  const [viewMonth, setViewMonth] = useState(fallbackMonth);

  useEffect(() => {
    if (!isValid(initialMonth)) return;
    setViewMonth((current) => {
      if (!isValid(current)) return initialMonth;
      if (calendarDays.length === 0) return current;
      const visible = calendarDays.some(
        (d) =>
          d.freeCount > 0 && isSameMonth(parseISO(d.date), current),
      );
      if (visible) return current;
      return initialMonth;
    });
  }, [calendarDays, initialMonth]);

  useEffect(() => {
    if (!rangeStart?.trim() || calendarDays.length === 0) return;
    setViewMonth(initialMonth);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- saltar al primer mes con huecos al cargar datos
  }, [rangeStart]);

  const safeViewMonth = isValid(viewMonth)
    ? viewMonth
    : isValid(initialMonth)
      ? initialMonth
      : fallbackMonth;
  const days = useMemo(() => monthGrid(safeViewMonth), [safeViewMonth]);
  const monthLabel = format(safeViewMonth, "LLLL yyyy", { locale: es });

  useEffect(() => {
    onVisibleMonthChange?.(safeViewMonth);
  }, [safeViewMonth, onVisibleMonthChange]);

  const canGoPrev = canShowPrevSeasonMonth(safeViewMonth, rangeStartDate);
  const canGoNext = canShowNextSeasonMonth(safeViewMonth, navigationEndDate);

  function dayStatusLabel(status: CalendarDayStatus | undefined): string {
    switch (status) {
      case "available":
        return "día con huecos libres";
      case "partial":
        return "algunos turnos ocupados";
      case "full":
        return "día completo";
      default:
        return "no disponible";
    }
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4",
        isLoading && "pointer-events-none opacity-70",
        className,
      )}
    >
      {isLoading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-zinc-950/40"
          aria-busy="true"
          aria-label="Cargando calendario"
        >
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-sky-400" />
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {LEGEND.map((item) => (
            <span
              key={item.status}
              className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500"
            >
              <span
                className={cn("h-3 w-3 rounded-sm", item.className)}
                aria-hidden
              />
              {item.label}
            </span>
          ))}
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading || disabled}
            className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800/80 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Actualizar disponibilidad del calendario"
          >
            {isLoading ? "Actualizando…" : "Actualizar calendario"}
          </button>
        )}
      </div>

      <div className="mx-auto w-full max-w-sm">
        <div
          className="grid grid-cols-[2.25rem_1fr_2.25rem] items-center gap-1"
          role="group"
          aria-label="Cambiar mes del calendario"
        >
          <button
            type="button"
            disabled={!canGoPrev || calendarDisabled}
            onClick={() => setViewMonth(subMonths(safeViewMonth, 1))}
            className="flex h-9 w-9 items-center justify-center justify-self-start rounded-md text-zinc-400 transition hover:bg-zinc-800/80 hover:text-zinc-200 disabled:opacity-25"
            aria-label="Mes anterior"
          >
            <span aria-hidden className="text-lg leading-none">
              ‹
            </span>
          </button>
          <p className="text-center text-sm font-medium capitalize text-zinc-200">
            {monthLabel}
          </p>
          <button
            type="button"
            disabled={!canGoNext || calendarDisabled}
            onClick={() => setViewMonth(addMonths(safeViewMonth, 1))}
            className="flex h-9 w-9 items-center justify-center justify-self-end rounded-md text-zinc-400 transition hover:bg-zinc-800/80 hover:text-zinc-200 disabled:opacity-25"
            aria-label="Mes siguiente"
          >
            <span aria-hidden className="text-lg leading-none">
              ›
            </span>
          </button>
        </div>

        <p className="mt-2 text-center text-[11px] text-zinc-500">
          Temporada {BOOKING_SEASON_LABEL} · elige turno en cada día marcado
        </p>

        <div className="mt-2 grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1 text-[10px] text-zinc-500">
            {label}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, safeViewMonth);
          const info = dayMap.get(key);
          const status = info?.status;
          const selected = selectedSet.has(key);
          const hasFree = (info?.freeCount ?? 0) > 0;
          const inRange =
            isDateInBookingSeason(day) &&
            !isBefore(day, rangeStartDate) &&
            !isAfter(day, navigationEndDate);
          const dataLoaded = dayMap.has(key);
          const clickable =
            inMonth &&
            inRange &&
            dataLoaded &&
            hasFree &&
            !calendarDisabled;
          const atMax =
            !selected &&
            selectedDates.length >= MAX_BOOKING_DAYS &&
            clickable;

          return (
            <div
              key={key}
              className={cn(
                "flex items-center justify-center",
                !inMonth && "pointer-events-none",
              )}
            >
              <button
                type="button"
                disabled={!clickable || atMax}
                onClick={() => clickable && !atMax && onSelectDate(key)}
                className={cn(
                  "relative flex h-9 w-9 flex-col items-center justify-center rounded-lg text-sm transition",
                  dayCellClass(status, selected, inMonth),
                  atMax && "opacity-40",
                  clickable && !atMax && "active:scale-95",
                )}
                aria-label={
                  inMonth && info
                    ? `${format(day, "EEEE d MMMM", { locale: es })} — ${dayStatusLabel(status)}`
                    : undefined
                }
                aria-pressed={selected}
              >
                <span>{format(day, "d")}</span>
                {inMonth && info && info.totalCount > 0 && !selected && (
                  <span
                    className="absolute bottom-0.5 text-[8px] font-medium opacity-80"
                    aria-hidden
                  >
                    {info.freeCount}/{info.totalCount}
                  </span>
                )}
              </button>
            </div>
          );
        })}
        </div>
      </div>

      {showSlotPicker ? (
        <div className="mt-6 border-t border-zinc-800/80 pt-5">
          <BookingSlotSeatMap
            sessionSlots={sessionSlots}
            pickedDates={selectedDates}
            calendarDays={calendarDays}
            availableSlots={availableSlots}
            selectedSlotByDate={selectedSlotByDate}
            onSelectSlotForDate={onSelectSlotForDate}
          />
        </div>
      ) : (
        emptySlotHint && (
          <p className="mt-4 text-center text-xs text-zinc-500">{emptySlotHint}</p>
        )
      )}

      {isError && (
        <p className="mt-4 text-center text-sm text-red-300">
          {loadError ?? "Error al cargar"}{" "}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="font-medium underline hover:text-red-100"
            >
              Reintentar
            </button>
          )}
        </p>
      )}
    </div>
  );
}
