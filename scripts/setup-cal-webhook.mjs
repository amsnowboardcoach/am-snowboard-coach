/**
 * Configura CAL_WEBHOOK_SECRET y registra el webhook en Cal.com (API v2)
 * Uso: node scripts/setup-cal-webhook.mjs [URL_PUBLICA]
 * Ejemplo: node scripts/setup-cal-webhook.mjs https://am-snowboard-coach.vercel.app/api/webhooks/cal
 */
import { randomBytes } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

function loadEnvLocal() {
  if (!existsSync(envPath)) return {};
  const text = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
    env[m[1]] = v;
  }
  return env;
}

function upsertEnv(key, value) {
  let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(env)) env = env.replace(re, line);
  else env = env.trimEnd() + (env ? "\n" : "") + line + "\n";
  writeFileSync(envPath, env);
}

const env = loadEnvLocal();
const apiKey = env.CALCOM_API_KEY;
if (!apiKey) {
  console.error("Falta CALCOM_API_KEY en .env.local");
  process.exit(1);
}

const subscriberUrl = process.argv[2];
if (!subscriberUrl?.startsWith("https://")) {
  console.error(
    "Indica la URL pública del webhook:\n  node scripts/setup-cal-webhook.mjs https://TU_DOMINIO/api/webhooks/cal",
  );
  process.exit(1);
}

const secret =
  env.CAL_WEBHOOK_SECRET?.trim() ||
  randomBytes(32).toString("hex");
upsertEnv("CAL_WEBHOOK_SECRET", secret);

const headers = {
  Authorization: `Bearer ${apiKey}`,
  "cal-api-version": "2024-06-14",
  "Content-Type": "application/json",
};

const triggers = [
  "BOOKING_CREATED",
  "BOOKING_CANCELLED",
  "BOOKING_RESCHEDULED",
  "BOOKING_REQUESTED",
];

const listRes = await fetch("https://api.cal.com/v2/webhooks", { headers });
if (!listRes.ok) {
  console.error("Error listando webhooks:", listRes.status, await listRes.text());
  process.exit(1);
}
const list = await listRes.json();
const existing = (list.data ?? []).find(
  (w) => w.subscriberUrl === subscriberUrl,
);

if (existing) {
  console.log("Webhook ya existe:", existing.id, subscriberUrl);
} else {
  const createRes = await fetch("https://api.cal.com/v2/webhooks", {
    method: "POST",
    headers,
    body: JSON.stringify({
      subscriberUrl,
      active: true,
      triggers,
      secret,
    }),
  });
  const body = await createRes.json();
  if (!createRes.ok) {
    console.error("Error creando webhook:", createRes.status, body);
    process.exit(1);
  }
  console.log("Webhook creado:", body.data?.id ?? body);
}

console.log("\nListo:");
console.log("  URL:", subscriberUrl);
console.log("  CAL_WEBHOOK_SECRET guardado en .env.local");
console.log("\nSi despliegas en Vercel, añade también CAL_WEBHOOK_SECRET y FIREBASE_ADMIN_* en el panel de Vercel.");
