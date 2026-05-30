/**
 * Actualiza el cliente OAuth de Google Sign-In en Firebase (Identity Platform).
 * Uso (cuenta con permisos de Editor en el proyecto):
 *
 *   $env:GOOGLE_WEB_CLIENT_ID="....apps.googleusercontent.com"
 *   $env:GOOGLE_WEB_CLIENT_SECRET="GOCSPX-..."
 *   node scripts/fix-google-auth-provider.mjs
 *
 * Token: usa gcloud (`gcloud auth login` como owner) o Firebase CLI ya logueado.
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";

const PROJECT_ID = "am-snowboard-coach";
const IDP_ID = "google.com";
const BASE = "https://identitytoolkit.googleapis.com/v2";

const clientId = process.env.GOOGLE_WEB_CLIENT_ID?.trim();
const clientSecret = process.env.GOOGLE_WEB_CLIENT_SECRET?.trim();

if (!clientId || !clientSecret) {
  console.error(
    "Faltan GOOGLE_WEB_CLIENT_ID y GOOGLE_WEB_CLIENT_SECRET en el entorno.",
  );
  process.exit(1);
}

function getAccessToken() {
  if (process.env.GCLOUD_ACCESS_TOKEN?.trim()) {
    return process.env.GCLOUD_ACCESS_TOKEN.trim();
  }
  const cfgPath = join(homedir(), ".config", "configstore", "firebase-tools.json");
  try {
    const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
    const token = cfg?.tokens?.access_token;
    if (token) return token;
  } catch {
    /* fall through */
  }
  try {
    return execSync("gcloud auth print-access-token", {
      encoding: "utf8",
    }).trim();
  } catch {
    throw new Error(
      "Sin token. Ejecuta: firebase login  (cuenta owner, ej. amsnowboardcoach@gmail.com)",
    );
  }
}

async function api(method, path, body) {
  const token = getAccessToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return data;
}

async function main() {
  const name = `projects/${PROJECT_ID}/defaultSupportedIdpConfigs/${IDP_ID}`;
  let cfg;
  try {
    cfg = await api(
      "GET",
      `/projects/${PROJECT_ID}/defaultSupportedIdpConfigs/${IDP_ID}`,
    );
    console.log("Cliente actual en Firebase:", cfg.clientId ?? "(vacío)");
    cfg.clientId = clientId;
    cfg.clientSecret = clientSecret;
    cfg.enabled = true;
    const updated = await api("PATCH", `/${name}?updateMask=clientId,clientSecret,enabled`, cfg);
    console.log("Actualizado:", updated.clientId);
  } catch (err) {
    if (String(err.message).includes("404")) {
      console.log("Creando configuración Google…");
      const created = await api(
        "POST",
        `/projects/${PROJECT_ID}/defaultSupportedIdpConfigs?idpId=${IDP_ID}`,
        { name, enabled: true, clientId, clientSecret },
      );
      console.log("Creado:", created.clientId);
      return;
    }
    throw err;
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
