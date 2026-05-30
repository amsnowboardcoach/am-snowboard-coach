/**
 * Muestra intervalos ocupados (freebusy) y eventos en un mes concreto.
 * Uso: node scripts/inspect-calendar-busy.mjs 2026-06
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const monthArg = process.argv[2] || "2026-06";
const [y, m] = monthArg.split("-").map(Number);
const timeMin = new Date(y, m - 1, 1);
const timeMax = new Date(y, m, 1);

const envPath = join(root, ".env.local");
const env = {};
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  let val = t.slice(eq + 1);
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[t.slice(0, eq)] = val;
}

const oauth2 = new google.auth.OAuth2(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
);
oauth2.setCredentials({ refresh_token: env.GOOGLE_REFRESH_TOKEN });
const calendar = google.calendar({ version: "v3", auth: oauth2 });
const calendarId = env.GOOGLE_CALENDAR_ID?.trim() || "primary";

const fb = await calendar.freebusy.query({
  requestBody: {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    items: [{ id: calendarId }],
  },
});
console.log(`Freebusy ${monthArg} (${calendarId}):`);
for (const b of fb.data.calendars?.[calendarId]?.busy ?? []) {
  console.log(`  ${b.start} → ${b.end}`);
}

const evRes = await calendar.events.list({
  calendarId,
  timeMin: timeMin.toISOString(),
  timeMax: timeMax.toISOString(),
  singleEvents: true,
  orderBy: "startTime",
  maxResults: 100,
});
console.log(`\nEventos (${(evRes.data.items ?? []).length}):`);
for (const ev of evRes.data.items ?? []) {
  console.log(`  ${ev.start?.dateTime ?? ev.start?.date} — ${ev.summary ?? "(sin título)"}`);
}
