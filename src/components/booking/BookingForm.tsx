"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addDays,
  endOfMonth,
  format,
  isAfter,
  min,
  parseISO,
  startOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { useSearchParams } from "next/navigation";
import { BookingAuthGate } from "@/components/booking/BookingAuthGate";
import { BookingAvailabilityCalendar } from "@/components/booking/BookingAvailabilityCalendar";
import type { DurationAvailabilityStatus } from "@/lib/booking/duration-availability";
import { CoachWhatsAppCard } from "@/components/contact/CoachWhatsAppCard";
import {
  BOOKING_PAYMENT_OPTIONS,
  BOOKING_BALANCE_ON_CLASS_DAY,
  BOOKING_BALANCE_PAYMENT_LABEL,
  BOOKING_DEPOSIT_PERCENT,
  type BookingPaymentOption,
} from "@/constants/booking-payment";
import { BOOKING_PAYMENT_OPTIONS_NOTE } from "@/constants/coach-contact";
import { useAuth } from "@/contexts/AuthProvider";
import { LESSON_TYPES } from "@/constants/lesson-types";
import {
  MAX_BOOKING_DAYS,
  formatDaysPlanLabel,
  inferDaysPlanFromDates,
} from "@/constants/booking-plan";
import {
  DEFAULT_SESSION_DURATION_ID,
  SESSION_DURATIONS,
  formatExtraParticipantsNote,
  getMaxParticipants,
  sessionTotalEuros,
  type SessionDurationId,
} from "@/constants/session-schedules";
import { getBookingAuthHeaders } from "@/lib/auth/booking-auth-headers";
import type { AvailableSlotOption } from "@/lib/booking/availability";
import { isDaySelectionComplete } from "@/lib/booking/multi-day";
import {
  clearBookingDraft,
  isBookingPendingSubmit,
  loadBookingDraft,
  saveBookingDraft,
  setBookingPendingSubmit,
} from "@/lib/booking/booking-draft";
import { computeBookingPaymentBreakdown } from "@/lib/booking/payment-amounts";
import { formatReservationSummaryLines } from "@/lib/booking/format-reservation";
import { scrollToId, scrollToTop } from "@/lib/navigation/scroll";
import {
  countDaysWithFreeSlots,
  mergeAvailableSlots,
  mergeCalendarDays,
} from "@/lib/booking/calendar-availability";
import type { CalendarDayInfo } from "@/lib/booking/calendar-availability";
import { BOOKING_SEASON_LABEL } from "@/constants/booking-availability";
import { BOOKING_AVAILABILITY_FETCH_DAYS } from "@/constants/booking-availability";
import {
  clampRangeToSeason,
  getBookableRangeStart,
  getBookingSeasonBounds,
} from "@/lib/booking/season";
import {
  formatSlotConflictMessage,
  freeSlotIdsForDate,
  nearestFreeSlotId,
} from "@/lib/booking/slot-suggestions";
import {
  parseReservarDuracion,
  parseReservarEstilo,
} from "@/lib/booking/reservar-url";
import { cn } from "@/lib/utils/cn";

type DurationAvailEntry = {
  status: DurationAvailabilityStatus;
  slots: AvailableSlotOption[];
  calendarDays: CalendarDayInfo[];
  rangeStart: string;
  rangeEnd: string;
  dayCount: number;
  error: string | null;
};

function bookingNavigationRangeEnd(): string {
  return getBookingSeasonBounds().end;
}

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

  function buildInitialAvailMap(): Record<SessionDurationId, DurationAvailEntry> {
  const map = {} as Record<SessionDurationId, DurationAvailEntry>;
  for (const s of SESSION_DURATIONS) {
    map[s.id] = {
      status: "loading",
      slots: [],
      calendarDays: [],
      rangeStart: "",
      rangeEnd: "",
      dayCount: 0,
      error: null,
    };
  }
  return map;
}

function FieldBlock({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  disabled,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-xl border px-4 py-3 text-left text-sm font-medium transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
        selected
          ? "border-sky-500 bg-sky-500/15 text-sky-100 ring-1 ring-sky-500/40"
          : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600",
        className,
      )}
    >
      {children}
    </button>
  );
}

function PriceSummary({
  lines,
  totalEuros,
  planLabel,
  chargeEuros,
  balanceEuros,
  paymentOption,
  className,
}: {
  lines: ReturnType<typeof formatReservationSummaryLines>;
  totalEuros: number;
  planLabel: string;
  chargeEuros: number;
  balanceEuros: number;
  paymentOption: BookingPaymentOption;
  className?: string;
}) {
  const items = [
    { n: 1, label: "Día", value: lines.day },
    { n: 2, label: "Estilo", value: lines.style },
    { n: 3, label: "Horario", value: lines.schedule },
    { n: 4, label: "Personas", value: lines.people },
  ];
  return (
    <div
      className={cn(
        "rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3",
        className,
      )}
    >
      <ol className="space-y-1.5 text-sm text-zinc-300">
        {items.map((item) => (
          <li key={item.n} className="flex gap-2">
            <span className="w-5 shrink-0 font-medium text-sky-400/90">
              {item.n}.
            </span>
            <span>
              <span className="text-zinc-500">{item.label}: </span>
              <span className="capitalize text-zinc-200">{item.value}</span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-2xl font-bold text-sky-300">{totalEuros} €</p>
      {paymentOption === "deposit_30" && balanceEuros > 0 ? (
        <p className="mt-1 text-sm text-zinc-400">
          Ahora con tarjeta:{" "}
          <span className="font-medium text-sky-300">{chargeEuros} €</span>{" "}
          (señal {BOOKING_DEPOSIT_PERCENT}%) · En pista:{" "}
          <span className="text-zinc-300">{balanceEuros} €</span>{" "}
          {BOOKING_BALANCE_PAYMENT_LABEL}
        </p>
      ) : (
        <p className="mt-1 text-sm text-zinc-400">
          Ahora con tarjeta:{" "}
          <span className="font-medium text-sky-300">{chargeEuros} €</span>
        </p>
      )}
      <p className="mt-0.5 text-xs text-zinc-500">{planLabel}</p>
    </div>
  );
}

export function BookingForm() {
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const canBook = Boolean(user?.email) && !authLoading;

  const [participantCount, setParticipantCount] = useState(1);
  const [durationId, setDurationId] = useState<SessionDurationId>(
    DEFAULT_SESSION_DURATION_ID,
  );
  const [slotId, setSlotId] = useState<string | null>(null);
  const [pickedDateKeys, setPickedDateKeys] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<AvailableSlotOption[]>([]);
  const [availByDuration, setAvailByDuration] = useState(buildInitialAvailMap);
  const [packError, setPackError] = useState<string | null>(null);
  const durationIdRef = useRef(durationId);

  const [lessonTypeId, setLessonTypeId] = useState<string>(LESSON_TYPES[0].id);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentOption, setPaymentOption] =
    useState<BookingPaymentOption>("deposit_30");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const autoSubmitStarted = useRef(false);

  const [success, setSuccess] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [depositPaidSuccess, setDepositPaidSuccess] = useState(false);
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);
  const [confirmedCharge, setConfirmedCharge] = useState<number | null>(null);
  const [confirmedBalance, setConfirmedBalance] = useState<number | null>(null);
  const [confirmedDayCount, setConfirmedDayCount] = useState(1);

  const session = useMemo(
    () =>
      SESSION_DURATIONS.find((s) => s.id === durationId) ?? SESSION_DURATIONS[0],
    [durationId],
  );

  const maxParticipants = getMaxParticipants(durationId);
  const perDayEuros = sessionTotalEuros(session, participantCount);
  const daysPlan = useMemo(
    () => inferDaysPlanFromDates(pickedDateKeys),
    [pickedDateKeys],
  );
  const billableDayCount = Math.max(
    pickedDateKeys.length,
    selectedDays.length,
    1,
  );
  const totalEuros = perDayEuros * billableDayCount;
  const totalAmountCents = totalEuros * 100;
  const paymentBreakdown = useMemo(
    () => computeBookingPaymentBreakdown(totalAmountCents, paymentOption),
    [totalAmountCents, paymentOption],
  );
  const chargeEuros = Math.round(paymentBreakdown.chargeAmountCents / 100);
  const balanceEuros = Math.round(paymentBreakdown.balanceAmountCents / 100);
  const planLabel = formatDaysPlanLabel(daysPlan, billableDayCount);
  const lesson = LESSON_TYPES.find((l) => l.id === lessonTypeId);

  const currentAvail = availByDuration[durationId] ?? {
    status: "loading" as DurationAvailabilityStatus,
    slots: [] as AvailableSlotOption[],
    calendarDays: [] as CalendarDayInfo[],
    rangeStart: "",
    rangeEnd: "",
    dayCount: 0,
    error: null,
  };
  const availability = currentAvail.slots;
  const calendarDays = currentAvail.calendarDays;
  const calendarRangeStart = currentAvail.rangeStart;
  const calendarRangeEnd = currentAvail.rangeEnd;
  const availStatus = currentAvail.status;
  const availError = currentAvail.error;

  const slotsForPickedDates = useMemo(() => {
    if (pickedDateKeys.length === 0) return [];
    return session.slots.filter((slot) =>
      pickedDateKeys.every((date) =>
        availability.some((o) => o.date === date && o.slotId === slot.id),
      ),
    );
  }, [pickedDateKeys, session.slots, availability]);

  const summaryLines = formatReservationSummaryLines({
    selectedDays,
    participantCount,
    lessonName: lesson?.name,
    notes,
  });

  useEffect(() => {
    durationIdRef.current = durationId;
  }, [durationId]);

  const availabilityFetchRef = useRef<string | null>(null);
  const availabilityGenRef = useRef(0);

  const fetchDurationAvailability = useCallback(
    async (
      id: SessionDurationId,
      range?: { start: string; end: string },
      merge = false,
    ) => {
      const requested = range ?? defaultAvailabilityFetchRange();
      const clamped = clampRangeToSeason(requested.start, requested.end);
      if (!clamped) {
        const season = getBookingSeasonBounds();
        setAvailByDuration((prev) => ({
          ...prev,
          [id]: {
            status: "empty",
            slots: [],
            calendarDays: [],
            rangeStart: getBookableRangeStart(),
            rangeEnd: season.end,
            dayCount: 0,
            error: null,
          },
        }));
        return;
      }
      const { start, end } = clamped;
      const fetchKey = `${id}:${start}:${end}:${merge}`;
      if (availabilityFetchRef.current === fetchKey) return;
      availabilityFetchRef.current = fetchKey;
      const gen = ++availabilityGenRef.current;

      setAvailByDuration((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: merge && prev[id]?.status === "ready" ? "ready" : "loading",
          error: null,
        },
      }));
      try {
        const params = new URLSearchParams({ durationId: id, start, end });
        const res = await fetch(`/api/bookings/availability?${params}`);
        const data = await res.json();
        if (gen !== availabilityGenRef.current) return;
        if (!res.ok) throw new Error(data.error ?? "Error de disponibilidad");
        if (data.error && (!data.days || data.days.length === 0)) {
          throw new Error(data.error);
        }
        const incomingSlots: AvailableSlotOption[] = data.slots ?? [];
        const incomingDays: CalendarDayInfo[] = data.days ?? [];
        let mergedSlots = incomingSlots;
        if (gen !== availabilityGenRef.current) return;
        setAvailByDuration((prev) => {
          const prior = prev[id];
          mergedSlots = merge
            ? mergeAvailableSlots(prior?.slots ?? [], incomingSlots)
            : incomingSlots;
          const calendarDays = merge
            ? mergeCalendarDays(prior?.calendarDays ?? [], incomingDays)
            : incomingDays;
          const dayCount = countDaysWithFreeSlots(calendarDays);
          const status: DurationAvailabilityStatus =
            dayCount > 0 ? "ready" : "empty";
          return {
            ...prev,
            [id]: {
              status,
              slots: mergedSlots,
              calendarDays,
              rangeStart: merge
                ? prior?.rangeStart || data.rangeStart || start
                : data.rangeStart ?? start,
              rangeEnd: end,
              dayCount,
              error: null,
            },
          };
        });
        if (durationIdRef.current === id && !merge) {
          setPickedDateKeys((picked) =>
            picked.filter((d) => mergedSlots.some((s) => s.date === d)),
          );
          setSelectedDays((days) =>
            days.filter((p) =>
              mergedSlots.some((s) => s.startUtc === p.startUtc),
            ),
          );
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo cargar disponibilidad";
        if (!merge) {
          setAvailByDuration((prev) => ({
            ...prev,
            [id]: {
              status: "error",
              slots: [],
              calendarDays: [],
              rangeStart: "",
              rangeEnd: "",
              dayCount: 0,
              error: message,
            },
          }));
          if (durationIdRef.current === id) {
            setPickedDateKeys([]);
            setSelectedDays([]);
          }
        }
      } finally {
        if (availabilityFetchRef.current === fetchKey) {
          availabilityFetchRef.current = null;
        }
      }
    },
    [],
  );

  const navigationRangeEnd = useMemo(() => bookingNavigationRangeEnd(), []);

  const handleVisibleMonth = useCallback(
    (month: Date) => {
      const id = durationIdRef.current;
      const entry = availByDuration[id];
      if (!entry?.rangeEnd || entry.status === "loading") return;

      const loadedEnd = parseISO(entry.rangeEnd);
      const navEnd = parseISO(navigationRangeEnd);
      const monthEnd = endOfMonth(month);
      if (isAfter(monthEnd, navEnd)) return;
      if (!isAfter(monthEnd, addDays(loadedEnd, -45))) return;

      const newEnd = format(
        min([addDays(loadedEnd, BOOKING_AVAILABILITY_FETCH_DAYS), navEnd]),
        "yyyy-MM-dd",
      );
      if (newEnd <= entry.rangeEnd) return;

      void fetchDurationAvailability(
        id,
        { start: entry.rangeStart || format(new Date(), "yyyy-MM-dd"), end: newEnd },
        true,
      );
    },
    [availByDuration, fetchDurationAvailability, navigationRangeEnd],
  );

  useEffect(() => {
    if (searchParams.get("paid") === "1") {
      setSuccess(true);
      setPaymentSuccess(true);
      setDepositPaidSuccess(searchParams.get("deposit") === "1");
    } else if (searchParams.get("cancelled") === "1") {
      setSubmitError(
        "El pago se canceló. Vuelve a reservar o escríbenos por WhatsApp si necesitas ayuda.",
      );
    }
  }, [searchParams]);

  useEffect(() => {
    const draft = loadBookingDraft();
    if (draft) {
      setParticipantCount(draft.participantCount);
      setDurationId(draft.durationId);
      setSlotId(draft.slotId);
      setPickedDateKeys(
        draft.pickedDateKeys ??
          (draft.selectedDays as AvailableSlotOption[]).map((d) => d.date),
      );
      setSelectedDays(draft.selectedDays as AvailableSlotOption[]);
      setLessonTypeId(draft.lessonTypeId);
      setNotes(draft.notes);
      if (draft.paymentOption) setPaymentOption(draft.paymentOption);
      if (isBookingPendingSubmit()) {
        setShowAuthGate(true);
      }
      return;
    }

    const duracion = parseReservarDuracion(searchParams.get("duracion"));
    if (duracion) {
      setDurationId(duracion);
      setParticipantCount((c) => Math.min(c, getMaxParticipants(duracion)));
    }
    const estilo = parseReservarEstilo(searchParams.get("estilo"));
    if (estilo) setLessonTypeId(estilo);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar
  }, []);

  useEffect(() => {
    if (authLoading || !user?.email) return;
    const displayName =
      profile?.displayName?.trim() ||
      user.displayName?.trim() ||
      user.email.split("@")[0] ||
      "Alumno";
    setName(displayName);
    setEmail(user.email);
  }, [authLoading, user, profile]);

  function pickDuration(id: SessionDurationId) {
    setDurationId(id);
    setSlotId(null);
    setPickedDateKeys([]);
    setSelectedDays([]);
    setPackError(null);
    setParticipantCount((c) => Math.min(c, getMaxParticipants(id)));
    const cached = availByDuration[id];
    if (cached?.status === "ready" || cached?.status === "empty") {
      return;
    }
    void fetchDurationAvailability(id);
  }

  function applySlotToAllDates(id: string) {
    setPackError(null);
    if (pickedDateKeys.length === 0) {
      setSelectedDays([]);
      setSlotId(null);
      return;
    }
    const days = pickedDateKeys
      .map((date) =>
        availability.find((o) => o.date === date && o.slotId === id),
      )
      .filter((o): o is AvailableSlotOption => Boolean(o));
    if (days.length !== pickedDateKeys.length) {
      setPackError(
        formatSlotConflictMessage(
          session.slots,
          id,
          pickedDateKeys,
          availability,
          (date) => format(parseISO(date), "d MMM", { locale: es }),
        ),
      );
      return;
    }
    setSlotId(id);
    setSelectedDays(days);
  }

  function pickSlotForDate(date: string, id: string) {
    setPackError(null);
    const option = availability.find((o) => o.date === date && o.slotId === id);
    if (!option) {
      const nearest = nearestFreeSlotId(
        session.slots,
        id,
        [...freeSlotIdsForDate(date, availability)],
      );
      if (nearest) {
        const alt = availability.find(
          (o) => o.date === date && o.slotId === nearest,
        );
        if (alt) {
          setSelectedDays((prev) => [
            ...prev.filter((d) => d.date !== date),
            alt,
          ].sort((a, b) => a.date.localeCompare(b.date)));
          return;
        }
      }
      setPackError(
        `El turno elegido no está libre el ${format(parseISO(date), "d MMM", { locale: es })}. Elige otro horario en la lista de ese día.`,
      );
      return;
    }
    setSelectedDays((prev) =>
      [...prev.filter((d) => d.date !== date), option].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    );
  }

  const selectedSlotByDate = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of selectedDays) {
      map.set(d.date, d.slotId);
    }
    return map;
  }, [selectedDays]);

  useEffect(() => {
    if (selectedDays.length === 0) {
      setSlotId(null);
      return;
    }
    const ids = new Set(selectedDays.map((d) => d.slotId));
    setSlotId(ids.size === 1 ? selectedDays[0]!.slotId : null);
  }, [selectedDays]);

  function pickDateKey(date: string) {
    setPackError(null);
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

  const datesPickedReady = pickedDateKeys.length >= 1;

  useEffect(() => {
    void fetchDurationAvailability(durationId);
  }, [durationId, fetchDurationAvailability]);

  useEffect(() => {
    if (!datesPickedReady || pickedDateKeys.length !== 1 || slotId) {
      return;
    }
    if (slotsForPickedDates.length === 1) {
      applySlotToAllDates(slotsForPickedDates[0]!.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-único turno (1 día)
  }, [datesPickedReady, pickedDateKeys.length, slotsForPickedDates, slotId]);

  const datesReady = isDaySelectionComplete(pickedDateKeys, selectedDays);

  const formReady = datesReady && datesPickedReady;

  const bookingSummary = `${summaryLines.day} · ${summaryLines.schedule} · ${summaryLines.people}`;

  function persistDraft() {
    saveBookingDraft({
      participantCount,
      daysPlan,
      consecutiveCount: pickedDateKeys.length,
      durationId,
      slotId,
      pickedDateKeys,
      selectedDays: selectedDays.map((d) => ({
        slotId: d.slotId,
        startUtc: d.startUtc,
        date: d.date,
        label: d.label,
      })),
      lessonTypeId,
      notes,
      paymentOption,
    });
  }

  const submitBooking = useCallback(async () => {
    if (!formReady || selectedDays.length === 0 || !canBook) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/bookings/reserve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await getBookingAuthHeaders()),
        },
        body: JSON.stringify({
          durationId,
          sessions: selectedDays.map((d) => ({
            slotId: d.slotId,
            startUtc: d.startUtc,
          })),
          daysPlan,
          name: name.trim(),
          email,
          lessonTypeId,
          participantCount,
          notes: notes.trim() || undefined,
          paymentOption,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al reservar");
      if (typeof data.checkoutUrl === "string" && data.checkoutUrl) {
        clearBookingDraft();
        window.location.href = data.checkoutUrl;
        return;
      }
      clearBookingDraft();
      setShowAuthGate(false);
      setConfirmedTotal(
        typeof data.totalEuros === "number" ? data.totalEuros : totalEuros,
      );
      setConfirmedCharge(
        typeof data.chargeEuros === "number" ? data.chargeEuros : chargeEuros,
      );
      setConfirmedBalance(
        typeof data.balanceEuros === "number" ? data.balanceEuros : balanceEuros,
      );
      setConfirmedDayCount(
        typeof data.dayCount === "number"
          ? data.dayCount
          : selectedDays.length,
      );
      setSuccess(true);
      setPaymentSuccess(false);
      setDepositPaidSuccess(false);
      scrollToTop();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "No se pudo enviar la solicitud",
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    formReady,
    selectedDays,
    canBook,
    durationId,
    daysPlan,
    name,
    email,
    lessonTypeId,
    participantCount,
    notes,
    paymentOption,
    totalEuros,
    chargeEuros,
    balanceEuros,
  ]);

  useEffect(() => {
    if (
      authLoading ||
      !formReady ||
      !canBook ||
      !showAuthGate ||
      autoSubmitStarted.current
    ) {
      return;
    }
    if (!isBookingPendingSubmit() && searchParams.get("book") !== "1") {
      return;
    }
    autoSubmitStarted.current = true;
    setBookingPendingSubmit(false);
    void submitBooking();
  }, [
    authLoading,
    formReady,
    canBook,
    showAuthGate,
    searchParams,
    submitBooking,
  ]);

  function openAuthGate() {
    persistDraft();
    setBookingPendingSubmit(true);
    setShowAuthGate(true);
    setSubmitError(null);
    requestAnimationFrame(() => {
      scrollToId("booking-auth-gate", { block: "start" });
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formReady) return;

    if (!canBook) {
      openAuthGate();
      return;
    }

    await submitBooking();
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-500/35 bg-emerald-500/10 p-8 text-center sm:p-10">
        <p className="text-2xl font-semibold text-emerald-300">
          {paymentSuccess
            ? depositPaidSuccess
              ? "¡Señal recibida!"
              : "¡Pago completado!"
            : "¡Solicitud enviada!"}
        </p>
        <p className="mx-auto mt-3 max-w-md text-sm text-zinc-300">
          {paymentSuccess
            ? depositPaidSuccess
              ? `Señal del ${BOOKING_DEPOSIT_PERCENT}% recibida. Alejandro revisará y aceptará tu plaza; el resto${confirmedBalance != null ? ` (${confirmedBalance} €)` : ""} en ${BOOKING_BALANCE_ON_CLASS_DAY}. Te avisamos por email cuando confirme.`
              : "Pago completo recibido. Alejandro revisará y aceptará tu plaza; te enviaremos los detalles por email cuando confirme."
            : confirmedDayCount > 1
              ? `Solicitud de ${confirmedDayCount} clases enviada. Completa el pago con tarjeta; Alejandro aceptará cada plaza después.`
              : "Solicitud enviada. Completa el pago con tarjeta; Alejandro aceptará tu plaza después."}
        </p>
        <ol className="mx-auto mt-4 max-w-sm space-y-1.5 text-left text-sm text-zinc-400">
          <li>
            <span className="text-zinc-500">1. Día: </span>
            <span className="capitalize">{summaryLines.day}</span>
          </li>
          <li>
            <span className="text-zinc-500">2. Estilo: </span>
            {lesson?.name ?? "—"}
          </li>
          <li>
            <span className="text-zinc-500">3. Horario: </span>
            {summaryLines.schedule}
          </li>
          <li>
            <span className="text-zinc-500">4. Personas: </span>
            {summaryLines.people}
          </li>
          {notes.trim() && (
            <li>
              <span className="text-zinc-500">5. Notas: </span>
              {notes.trim()}
            </li>
          )}
        </ol>
        {confirmedTotal != null && (
          <p className="mt-4 text-lg font-medium text-sky-300">
            {confirmedTotal} € total
            {paymentSuccess && confirmedCharge != null && (
              <span className="block text-sm font-normal text-zinc-400">
                {depositPaidSuccess
                  ? `Pagado ahora: ${confirmedCharge} € · Saldo en pista: ${confirmedBalance ?? 0} €`
                  : `Pagado con tarjeta: ${confirmedCharge} €`}
              </span>
            )}
            <span className="block text-sm font-normal text-zinc-500">
              {participantCount} personas · {confirmedDayCount}{" "}
              {confirmedDayCount === 1 ? "clase" : "clases"}
            </span>
          </p>
        )}
        {canBook && selectedDays[0] && (
          <CoachWhatsAppCard
            className="mt-6 text-left"
            compact
            prefill={`Hola Alejandro, acabo de reservar ${confirmedDayCount > 1 ? `${confirmedDayCount} clases` : session.name}. `}
          />
        )}
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setPaymentSuccess(false);
            setDepositPaidSuccess(false);
            setConfirmedTotal(null);
            setConfirmedCharge(null);
            setConfirmedBalance(null);
            pickDuration(DEFAULT_SESSION_DURATION_ID);
            setNotes("");
            setSubmitError(null);
            setPickedDateKeys([]);
            setSelectedDays([]);
            setParticipantCount(1);
          }}
          className="mt-8 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-zinc-950 hover:bg-sky-400"
        >
          Nueva reserva
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <FieldBlock
        title="1. Día y turno"
        hint={`Temporada ${BOOKING_SEASON_LABEL}. Elige fechas y turno; puedes cambiar la duración en el siguiente paso.`}
      >
        {packError && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {packError}
          </p>
        )}

        <BookingAvailabilityCalendar
          calendarDays={calendarDays}
          rangeStart={calendarRangeStart}
          rangeEnd={calendarRangeEnd}
          navigationRangeEnd={navigationRangeEnd}
          availableSlots={availability}
          sessionSlots={session.slots}
          selectedDates={pickedDateKeys}
          selectedSlotByDate={selectedSlotByDate}
          onSelectDate={pickDateKey}
          onSelectSlotForDate={pickSlotForDate}
          onSelectSlotForAllDates={applySlotToAllDates}
          loadStatus={availStatus}
          loadError={availError}
          onRetry={() => void fetchDurationAvailability(durationId)}
          onVisibleMonthChange={handleVisibleMonth}
        />
        {pickedDateKeys.length > 0 && (
          <p className="text-sm text-zinc-400">
            <span className="text-zinc-500">
              {pickedDateKeys.length === 1 ? "Elegido: " : "Elegidos: "}
            </span>
            {pickedDateKeys
              .map((d) => format(parseISO(d), "EEE d MMM", { locale: es }))
              .join(" · ")}
          </p>
        )}
      </FieldBlock>

      <FieldBlock title="2. Duración en pista">
        <div className="grid gap-2 sm:grid-cols-3">
          {SESSION_DURATIONS.map((d) => (
            <ChoiceButton
              key={d.id}
              selected={durationId === d.id}
              onClick={() => pickDuration(d.id)}
            >
              <span className="block font-semibold">{d.shortLabel}</span>
              <span className="mt-1 block text-xs text-zinc-500">
                desde {sessionTotalEuros(d, 1)} €
              </span>
            </ChoiceButton>
          ))}
        </div>
      </FieldBlock>

      <FieldBlock title="3. Estilo de clase">
        <div className="grid gap-2 sm:grid-cols-3">
          {LESSON_TYPES.map((l) => (
            <ChoiceButton
              key={l.id}
              selected={lessonTypeId === l.id}
              onClick={() => setLessonTypeId(l.id)}
              className="text-center sm:text-left"
            >
              <span className="block font-semibold">{l.name}</span>
            </ChoiceButton>
          ))}
        </div>
      </FieldBlock>

      <FieldBlock
        title="4. Número de personas"
        hint={`En pista · máx. ${maxParticipants} con ${session.shortLabel}`}
      >
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: maxParticipants }, (_, i) => i + 1).map((n) => (
            <ChoiceButton
              key={n}
              selected={participantCount === n}
              onClick={() => setParticipantCount(n)}
              className="min-w-[3.25rem] text-center"
            >
              {n}
            </ChoiceButton>
          ))}
        </div>
        <p className="text-xs text-zinc-600">
          {formatExtraParticipantsNote(session)}
        </p>
      </FieldBlock>

      <FieldBlock title="5. Notas" hint="Opcional">
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Nivel, objetivos, teléfono de contacto…"
          className="form-input"
        />
      </FieldBlock>

      <FieldBlock
        title="6. Forma de pago"
        hint="El pago con tarjeta se completa justo después de enviar la solicitud"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {BOOKING_PAYMENT_OPTIONS.map((opt) => (
            <ChoiceButton
              key={opt.id}
              selected={paymentOption === opt.id}
              onClick={() => setPaymentOption(opt.id)}
            >
              <span className="block font-semibold">{opt.label}</span>
              <span className="mt-1 block text-xs font-normal text-zinc-500">
                {opt.description}
              </span>
            </ChoiceButton>
          ))}
        </div>
      </FieldBlock>

      {showAuthGate && formReady && (
        <BookingAuthGate
          totalEuros={totalEuros}
          summary={bookingSummary}
          onError={setAuthError}
          onGoogleSuccess={() => {
            setShowAuthGate(true);
            setBookingPendingSubmit(true);
          }}
        />
      )}

      {authError && (
        <p className="text-sm text-red-400" role="alert">
          {authError}
        </p>
      )}

      {submitError && (
        <p className="text-sm text-red-400" role="alert">
          {submitError}
        </p>
      )}

      <div
        id="booking-summary"
        className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-10 -mx-2 space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/95 p-4 shadow-xl backdrop-blur-md sm:static sm:mx-0 sm:border-zinc-800/80 sm:bg-transparent sm:p-0 sm:shadow-none"
      >
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Resumen</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            {formReady
              ? "Revisa tu reserva antes de continuar"
              : "Se actualiza al completar los pasos"}
          </p>
        </div>
        <PriceSummary
          lines={summaryLines}
          totalEuros={totalEuros}
          planLabel={planLabel}
          chargeEuros={chargeEuros}
          balanceEuros={balanceEuros}
          paymentOption={paymentOption}
          className="border-zinc-800 bg-zinc-900/60 sm:border-sky-500/30 sm:bg-sky-500/10"
        />
        <button
          type="submit"
          disabled={submitting || !formReady}
          className="w-full rounded-full bg-sky-500 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Preparando pago…"
            : !formReady
              ? pickedDateKeys.length === 0
                ? "Elige al menos un día"
                : selectedDays.length < pickedDateKeys.length
                  ? `Elige turno (${selectedDays.length}/${pickedDateKeys.length} días)`
                  : "Completa día, turno y estilo"
              : showAuthGate && canBook
                ? `Reservar y pagar ${chargeEuros} €`
                : `Reservar y pagar ${chargeEuros} €`}
        </button>
        <p className="mt-2 text-center text-xs text-zinc-500">
          {formReady && !showAuthGate
            ? "Al pulsar reservar entrarás con tu cuenta (o la crearás en un paso). "
            : null}
          {BOOKING_PAYMENT_OPTIONS_NOTE}
        </p>
      </div>
    </form>
  );
}
