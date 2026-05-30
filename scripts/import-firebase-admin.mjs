/**
 * Importa la clave de cuenta de servicio de Firebase a .env.local
 * Uso: node scripts/import-firebase-admin.mjs "C:\ruta\am-snowboard-coach-firebase-adminsdk.json"
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

const keyPath = process.argv[2];
if (!keyPath || !existsSync(keyPath)) {
  console.error("Uso: node scripts/import-firebase-admin.mjs <ruta-al-json>");
  process.exit(1);
}

const key = JSON.parse(readFileSync(keyPath, "utf8"));
const projectId = key.project_id;
const clientEmail = key.client_email;
const privateKey = key.private_key;

if (!projectId || !clientEmail || !privateKey) {
  console.error("JSON inválido: falta project_id, client_email o private_key");
  process.exit(1);
}

const secretsDir = join(root, "secrets");
const destKey = join(secretsDir, "firebase-admin.json");
if (!existsSync(secretsDir)) {
  mkdirSync(secretsDir, { recursive: true });
}
writeFileSync(destKey, JSON.stringify(key, null, 2));

const escapedKey = privateKey.replace(/\n/g, "\\n");
const lines = [
  `FIREBASE_ADMIN_PROJECT_ID=${projectId}`,
  `FIREBASE_ADMIN_CLIENT_EMAIL=${clientEmail}`,
  `FIREBASE_ADMIN_PRIVATE_KEY="${escapedKey}"`,
  `GOOGLE_APPLICATION_CREDENTIALS=secrets/firebase-admin.json`,
];

let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
for (const line of lines) {
  const keyName = line.split("=")[0];
  const re = new RegExp(`^${keyName}=.*$`, "m");
  if (re.test(env)) {
    env = env.replace(re, line);
  } else {
    if (env.length > 0 && !env.endsWith("\n")) env += "\n";
    env += line + "\n";
  }
}
writeFileSync(envPath, env);
console.log("OK: Firebase Admin guardado en secrets/firebase-admin.json y .env.local");
