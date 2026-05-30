import type { BookingDaysPlan } from "@/constants/booking-plan";
import type { BookingPaymentOption } from "@/constants/booking-payment";
import type { SessionDurationId } from "@/constants/session-schedules";

const DRAFT_KEY = "am-booking-draft";
const PENDING_KEY = "am-booking-pending-submit";

export interface BookingDraftSlot {
  slotId: string;
  startUtc: string;
  date: string;
  label: string;
}

export interface BookingDraft {
  participantCount: number;
  daysPlan: BookingDaysPlan;
  consecutiveCount: number;
  durationId: SessionDurationId;
  slotId: string | null;
  pickedDateKeys: string[];
  selectedDays: BookingDraftSlot[];
  lessonTypeId: string;
  notes: string;
  paymentOption: BookingPaymentOption;
}

export function saveBookingDraft(draft: BookingDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadBookingDraft(): BookingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as BookingDraft;
  } catch {
    return null;
  }
}

export function clearBookingDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DRAFT_KEY);
  sessionStorage.removeItem(PENDING_KEY);
}

export function setBookingPendingSubmit(pending: boolean): void {
  if (typeof window === "undefined") return;
  if (pending) sessionStorage.setItem(PENDING_KEY, "1");
  else sessionStorage.removeItem(PENDING_KEY);
}

export function isBookingPendingSubmit(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PENDING_KEY) === "1";
}
