/**
 * Genera URL OAuth y (con servidor local) el refresh token de Google Calendar.
 *
 * 1. Añade GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env.local
 * 2. node scripts/google-oauth-setup.mjs
 * 3. Abre la URL, inicia sesión con amsnowboardcoach@gmail.com
 * 4. Copia el código de la URL de redirección y pégalo cuando lo pida el script
 *
 * Usa un cliente OAuth tipo **Aplicación de escritorio** en Google Cloud (no "Web").
 * Redirect loopback 127.0.0.1 — evita redirect_uri_mismatch.
 */
import { createServer } from "http";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

function loadEnv() {
  if (!existsSync(envPath)) return {};
  const text = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
  return env;
}

const env = loadEnv();
const clientId = env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const clientSecret = env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error("Falta GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env.local");
  process.exit(1);
}

/** Desktop OAuth: no hace falta registrar esta URI en Cloud Console */
const REDIRECT = "http://127.0.0.1:3333/oauth2callback";
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });

console.log("\n1. Cliente OAuth debe ser tipo **Aplicación de escritorio** (ver docs/GOOGLE_OAUTH_FIX.md)\n");
console.log("2. Abre esta URL e inicia sesión con amsnowboardcoach@gmail.com:\n");
console.log(authUrl);
console.log("\n3. Esperando código en http://127.0.0.1:3333 ...\n");

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1:3333");
  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400);
    res.end("Sin código");
    return;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.refresh_token) {
      res.end("Error: sin refresh_token. Revoca acceso en Google y repite con prompt=consent.");
      console.error(tokens);
      process.exit(1);
    }

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>OK</h1><p>Puedes cerrar esta ventana.</p>");

    if (existsSync(envPath)) {
      let text = readFileSync(envPath, "utf8");
      if (/^GOOGLE_REFRESH_TOKEN=/m.test(text)) {
        text = text.replace(
          /^GOOGLE_REFRESH_TOKEN=.*$/m,
          `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`,
        );
      } else {
        text += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`;
      }
      writeFileSync(envPath, text, "utf8");
      console.log("\n✓ GOOGLE_REFRESH_TOKEN guardado en .env.local\n");
    } else {
      console.log(`\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    }
    server.close();
    process.exit(0);
  } catch (e) {
    console.error(e);
    res.end("Error");
    process.exit(1);
  }
});

server.listen(3333);
