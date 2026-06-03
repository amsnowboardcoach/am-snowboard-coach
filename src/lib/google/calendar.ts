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

/** Calendario donde se crean eventos al aceptar reservas web. */
export function getWriteCalendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID?.trim() || "primary";
}

function parseCalendarIdList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Calendarios consultados con freeBusy (unión de ocupación).
 * Incluye el de escritura + Explora/extra si están en env.
 */
export function getBusyCalendarIds(): string[] {
  const ids = new Set<string>([getWriteCalendarId()]);
  const explora = process.env.GOOGLE_EXPLORA_CALENDAR_ID?.trim();
  if (explora) ids.add(explora);
  for (const id of parseCalendarIdList(process.env.GOOGLE_BUSY_CALENDAR_IDS)) {
    ids.add(id);
  }
  return [...ids];
}

/** Calendarios adicionales donde duplicar el evento al confirmar (p. ej. Explora). */
export function getMirrorCalendarIds(): string[] {
  const writeId = getWriteCalendarId();
  const mirrors = new Set<string>();
  const explora = process.env.GOOGLE_EXPLORA_CALENDAR_ID?.trim();
  if (explora && explora !== writeId) mirrors.add(explora);
  for (const id of parseCalendarIdList(process.env.GOOGLE_MIRROR_CALENDAR_IDS)) {
    if (id !== writeId) mirrors.add(id);
  }
  return [...mirrors];
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

/** Intervalos ocupados en todos los calendarios configurados (Explora + AM, etc.). */
export async function fetchBusyIntervals(
  timeMin: Date,
  timeMax: Date,
): Promise<{ start: Date; end: Date }[]> {
  const calendarIds = getBusyCalendarIds();
  const calendar = getCalendarApi();
  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: BOOKING_TIMEZONE,
      items: calendarIds.map((id) => ({ id })),
    },
  });

  const merged: { start: Date; end: Date }[] = [];
  const calendars = res.data.calendars ?? {};

  for (const id of calendarIds) {
    const entry = calendars[id];
    if (entry?.errors?.length) {
      console.warn(
        `[calendar] freebusy no disponible para ${id}:`,
        entry.errors,
      );
      continue;
    }
    const busy = entry?.busy ?? [];
    for (const b of busy) {
      if (b.start && b.end) {
        merged.push({
          start: new Date(b.start),
          end: new Date(b.end),
        });
      }
    }
  }

  return merged;
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
  alumnoEmail: string;
  alumnoName: string;
  location?: string;
}

export async function createCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<string> {
  const calendar = getCalendarApi();
  const writeCalendarId = getWriteCalendarId();
  const eventBody = {
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
    attendees: [{ email: input.alumnoEmail, displayName: input.alumnoName }],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 60 },
      ],
    },
  };

  const res = await calendar.events.insert({
    calendarId: writeCalendarId,
    sendUpdates: "all",
    requestBody: eventBody,
  });

  const eventId = res.data.id;
  if (!eventId) throw new Error("Google Calendar no devolvió id de evento");

  for (const mirrorId of getMirrorCalendarIds()) {
    try {
      await calendar.events.insert({
        calendarId: mirrorId,
        sendUpdates: "none",
        requestBody: eventBody,
      });
    } catch (err) {
      console.warn(`[calendar] no se pudo reflejar evento en ${mirrorId}:`, err);
    }
  }

  return eventId;
}
