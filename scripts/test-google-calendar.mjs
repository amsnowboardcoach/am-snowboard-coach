import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { google } from "googleapis";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");
const env = {};
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const oauth2 = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
oauth2.setCredentials({ refresh_token: env.GOOGLE_REFRESH_TOKEN });
const calendar = google.calendar({ version: "v3", auth: oauth2 });

const now = new Date();
const later = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
const res = await calendar.freebusy.query({
  requestBody: {
    timeMin: now.toISOString(),
    timeMax: later.toISOString(),
    items: [{ id: env.GOOGLE_CALENDAR_ID || "primary" }],
  },
});
console.log("OK: Google Calendar conectado (calendario primary)");
