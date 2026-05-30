import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

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

const user = env.SMTP_USER;
const pass = env.SMTP_PASS;
if (!user || !pass) {
  console.error("SMTP_USER o SMTP_PASS vacíos");
  process.exit(1);
}

const transport = nodemailer.createTransport({
  host: env.SMTP_HOST || "smtp.gmail.com",
  port: Number(env.SMTP_PORT) || 587,
  secure: false,
  auth: { user, pass },
});

try {
  await transport.verify();
  console.log("OK: SMTP autenticado correctamente");
} catch (e) {
  console.error("SMTP falló:", e.message);
  console.error(
    "\nGmail suele rechazar la contraseña normal. Usa una contraseña de aplicación:\n" +
      "https://myaccount.google.com/apppasswords\n",
  );
  process.exit(1);
}
