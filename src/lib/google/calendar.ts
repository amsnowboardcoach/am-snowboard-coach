import { google } from "googleapis";
import { toCalendarDateTimeLocal } from "@/lib/booking/format-datetime";
import { BOOKING_TIMEZONE } from "@/lib/booking/timezone";

export class GoogleCalendarNotConfiguredError extends Error {
  constructor() {
    super(
      "Google Calendar: configura GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET y GOOGLE_REFRESH_TOKEN",
    );
    this.name = "GoogleCalendarNotConfiguredError";
  }
}

export function isGoogleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim() &&
      process.env.GOOGLE_REFRESH_TOKEN?.trim(),
  );
}

function getCalendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID?.trim() || "primary";
}

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new GoogleCalendarNotConfiguredError();
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

export function getCalendarApi() {
  return google.calendar({ version: "v3", auth: getOAuthClient() });
}

/** Intervalos ocupados en el calendario del coach (ISO) */
export async function fetchBusyIntervals(
  timeMin: Date,
  timeMax: Date,
): Promise<{ start: Date; end: Date }[]> {
  const calendar = getCalendarApi();
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: BOOKING_TIMEZONE,
      items: [{ id: getCalendarId() }],
    },
  });

  const busy = res.data.calendars?.[getCalendarId()]?.busy ?? [];
  return busy
    .filter((b) => b.start && b.end)
    .map((b) => ({
      start: new Date(b.start!),
      end: new Date(b.end!),
    }));
}

function overlaps(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function isIntervalFree(
  start: Date,
  end: Date,
  busy: { start: Date; end: Date }[],
): boolean {
  return !busy.some((b) => overlaps(start, end, b.start, b.end));
}

export interface CreateCalendarEventInput {
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  studentEmail: string;
  studentName: string;
  location?: string;
}

export async function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<string> {
  const calendar = getCalendarApi();
  const res = await calendar.events.insert({
    calendarId: getCalendarId(),
    sendUpdates: "all",
    requestBody: {
      summary: input.summary,
      description: input.description,
      location: input.location,
      start: {
        dateTime: toCalendarDateTimeLocal(input.start),
        timeZone: BOOKING_TIMEZONE,
      },
      end: {
        dateTime: toCalendarDateTimeLocal(input.end),
        timeZone: BOOKING_TIMEZONE,
      },
      attendees: [
        { email: input.studentEmail, displayName: input.studentName },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 60 },
        ],
      },
    },
  });

  const eventId = res.data.id;
  if (!eventId) throw new Error("Google Calendar no devolvió id de evento");
  return eventId;
}
