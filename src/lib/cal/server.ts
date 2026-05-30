const LEGACY_CALCOM_USERNAME = "am-snowboard-coach";
import type { CalSlotRange } from "@/lib/booking/availability";

const CAL_API = "https://api.cal.com/v2";
const CAL_API_VERSION = "2024-09-04";

function getApiKey(): string {
  const key = process.env.CALCOM_API_KEY?.trim();
  if (!key) throw new Error("CALCOM_API_KEY no configurada");
  return key;
}

function calHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "cal-api-version": CAL_API_VERSION,
    "Content-Type": "application/json",
  };
}

export async function fetchCalSlotRanges(
  eventTypeSlug: string,
  startDate: string,
  endDate: string,
): Promise<Record<string, CalSlotRange[]>> {
  const params = new URLSearchParams({
    eventTypeSlug,
    username:
      process.env.NEXT_PUBLIC_CALCOM_USERNAME?.trim() || LEGACY_CALCOM_USERNAME,
    start: startDate,
    end: endDate,
    timeZone: "Europe/Madrid",
    format: "range",
  });

  const res = await fetch(`${CAL_API}/slots?${params}`, {
    headers: calHeaders(),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cal.com slots: ${res.status} ${text}`);
  }

  const json = (await res.json()) as {
    status: string;
    data?: Record<string, CalSlotRange[]>;
  };

  return json.data ?? {};
}

export interface CreateCalBookingInput {
  eventTypeSlug: string;
  startUtc: string;
  attendeeName: string;
  attendeeEmail: string;
  notes?: string;
}

export interface CreateCalBookingResult {
  uid: string;
  bookingId: number;
  start: string;
  end: string;
  status: string;
}

export async function createCalBooking(
  input: CreateCalBookingInput,
): Promise<CreateCalBookingResult> {
  const body: Record<string, unknown> = {
    eventTypeSlug: input.eventTypeSlug,
    username:
      process.env.NEXT_PUBLIC_CALCOM_USERNAME?.trim() || LEGACY_CALCOM_USERNAME,
    start: input.startUtc,
    attendee: {
      name: input.attendeeName,
      email: input.attendeeEmail,
      timeZone: "Europe/Madrid",
    },
  };

  if (input.notes?.trim()) {
    body.bookingFieldsResponses = { notes: input.notes.trim() };
  }

  const res = await fetch(`${CAL_API}/bookings`, {
    method: "POST",
    headers: calHeaders(),
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as {
    status: string;
    data?: {
      uid: string;
      id: number;
      start: string;
      end: string;
      status: string;
    };
    error?: { message?: string };
  };

  if (!res.ok || !json.data?.uid) {
    throw new Error(
      json.error?.message ?? `Cal.com booking: ${res.status}`,
    );
  }

  return {
    uid: json.data.uid,
    bookingId: json.data.id,
    start: json.data.start,
    end: json.data.end,
    status: json.data.status,
  };
}
