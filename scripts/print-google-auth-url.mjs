/**
 * Imprime la URL de autorización de Google Calendar.
 * Requiere: npm run dev (puerto 3000) y URI de redirección en Google Cloud.
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");

if (!existsSync(envPath)) {
  console.error("Falta .env.local");
  process.exit(1);
}

const env = {};
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const clientId = env.GOOGLE_CLIENT_ID;
if (!clientId) {
  console.error("Falta GOOGLE_CLIENT_ID en .env.local");
  process.exit(1);
}

const port = process.env.PORT || "3000";
const redirectUri = `http://localhost:${port}/api/auth/google/callback`;

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
  });

console.log("\n=== Google Calendar OAuth ===\n");
console.log("1. En Google Cloud → Credenciales → tu cliente OAuth WEB");
console.log("   (ID que termina en ...ctlck5.apps.googleusercontent.com)");
console.log("\n2. En URIs de redirección autorizados, añade EXACTAMENTE:\n");
console.log(`   ${redirectUri}\n`);
console.log("   (No confundir con 'Orígenes de JavaScript autorizados')\n");
console.log("3. Guarda, espera 1 minuto, ejecuta: npm run dev\n");
console.log("4. Abre esta URL:\n");
console.log(authUrl);
console.log("\n");
