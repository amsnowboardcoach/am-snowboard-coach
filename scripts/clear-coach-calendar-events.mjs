/**
 * Lista y elimina eventos del calendario del coach que bloquean disponibilidad
 * (p. ej. tras borrar reservas en Firestore sin quitar el evento de Google).
 *
 *   node scripts/clear-coach-calendar-events.mjs
 *   node scripts/clear-coach-calendar-events.mjs --confirm
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { addDays, format } from "date-fns";
import { google } from "googleapis";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");
const confirm = process.argv.includes("--confirm");

function isBlockingClassEvent(summary) {
  if (/^Clase snowboard\s*—/i.test(summary)) return true;
  if (/^Curso de \d horas/i.test(summary)) return true;
  if (/between AM Snowboard Coach/i.test(summary)) return true;
  return false;
}

function loadEnv() {
  if (!existsSync(envPath)) {
    console.error("Falta .env.local");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    let val = trimmed.slice(eq + 1);
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[trimmed.slice(0, eq)] = val.replace(/\\n/g, "\n");
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  const refreshToken = env.GOOGLE_REFRESH_TOKEN?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    console.error("Faltan GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN");
    process.exit(1);
  }

  const calendarId = env.GOOGLE_CALENDAR_ID?.trim() || "primary";
  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  const calendar = google.calendar({ version: "v3", auth: oauth2 });

  const timeMin = new Date();
  const daysAhead = Number(process.env.BOOKING_LOOKAHEAD_DAYS) || 365;
  const timeMax = addDays(timeMin, daysAhead);
  const listAll = process.argv.includes("--list-all");

  console.log(
    confirm ? "=== BORRANDO EVENTOS ===" : "=== VISTA PREVIA (añade --confirm) ===",
  );
  console.log(`Calendario: ${calendarId}`);
  console.log(
    `Rango: ${format(timeMin, "yyyy-MM-dd")} → ${format(timeMax, "yyyy-MM-dd")}\n`,
  );

  const toDelete = [];
  const allEvents = [];
  let pageToken;

  do {
    const res = await calendar.events.list({
      calendarId,
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 250,
      pageToken,
    });

    for (const ev of res.data.items ?? []) {
      const summary = ev.summary ?? "(sin título)";
      const start = ev.start?.dateTime ?? ev.start?.date ?? "?";
      allEvents.push({ id: ev.id, summary, start });
      if (isBlockingClassEvent(summary)) {
        toDelete.push({ id: ev.id, summary, start });
      }
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken);

  if (listAll) {
    console.log(`\nTodos los eventos (${allEvents.length}):`);
    for (const ev of allEvents) {
      const mark = isBlockingClassEvent(ev.summary) ? "[BLOQ]" : "     ";
      console.log(`${mark} ${ev.start} — ${ev.summary}`);
    }
    if (!confirm) return;
  }

  if (toDelete.length === 0) {
    console.log("No hay eventos de clase (web o Cal.com legacy) en ese rango.");
    if (allEvents.length > 0) {
      console.log(
        `\nHay ${allEvents.length} otro(s) evento(s) en el calendario que pueden marcar huecos ocupados.`,
      );
      console.log("Usa --list-all para verlos.");
    } else {
      console.log(
        "\nSi el calendario sigue marcando días ocupados, revisa otros calendarios vinculados en Google.",
      );
    }
    return;
  }

  for (const ev of toDelete) {
    console.log(`  · ${ev.start} — ${ev.summary}`);
  }
  console.log(`\nTotal: ${toDelete.length} evento(s) de clases`);

  if (!confirm) {
    console.log("\nEjecuta: node scripts/clear-coach-calendar-events.mjs --confirm");
    return;
  }

  for (const ev of toDelete) {
    await calendar.events.delete({ calendarId, eventId: ev.id });
  }
  console.log("\n=== LISTO: eventos eliminados del calendario ===");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
