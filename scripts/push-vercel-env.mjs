/**
 * Sube variables de servidor a Vercel production (desde .env.local)
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env.local");

if (!existsSync(envPath)) {
  console.error("Falta .env.local");
  process.exit(1);
}

const text = readFileSync(envPath, "utf8");
const keys = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
  "GOOGLE_CALENDAR_ID",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "BOOKING_FROM_EMAIL",
  "BOOKING_NOTIFY_EMAIL",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_FIREBASE_VAPID_KEY",
  "PEXELS_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

for (const key of keys) {
  const m = text.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m?.[1]?.trim()) {
    console.warn(`Omitido (vacío): ${key}`);
    continue;
  }
  let v = m[1].trim();
  if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
  try {
    execSync(`npx vercel env rm ${key} production --yes`, {
      cwd: root,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    /* no existía */
  }
  execSync(`npx vercel env add ${key} production --yes`, {
    cwd: root,
    input: v,
    stdio: ["pipe", "inherit", "inherit"],
  });
  console.log(`OK ${key}`);
}

console.log("\nHecho. Ejecuta: vercel deploy --prod --yes");
