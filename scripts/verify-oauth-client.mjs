/**
 * Comprueba si un OAuth client ID sigue activo en Google (no deleted_client).
 * Uso: node scripts/verify-oauth-client.mjs [client-id]
 */
const clientId =
  process.argv[2]?.trim() ||
  process.env.GOOGLE_WEB_CLIENT_ID?.trim();

if (!clientId) {
  console.error("Pasa el client ID como argumento o GOOGLE_WEB_CLIENT_ID");
  process.exit(1);
}

const redirectUri =
  "https://am-snowboard-coach.firebaseapp.com/__/auth/handler";
const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
url.searchParams.set("client_id", clientId);
url.searchParams.set("redirect_uri", redirectUri);
url.searchParams.set("response_type", "code");
url.searchParams.set("scope", "openid email");

const res = await fetch(url);
const html = await res.text();

if (html.includes("deleted_client")) {
  console.error("BORRADO: este client ID ya no existe en Google Cloud.");
  console.error("Crea uno nuevo en Credenciales y ejecuta fix-google-auth-provider.mjs");
  process.exit(1);
}
if (html.includes("redirect_uri_mismatch")) {
  console.error("REDIRECT MAL: falta en el cliente:");
  console.error(" ", redirectUri);
  process.exit(1);
}
if (html.includes("invalid_client")) {
  console.error("CLIENTE INVALIDO: revisa el ID en Google Cloud / Firebase.");
  process.exit(1);
}
if (html.includes("errorview") || html.includes("oauth/error")) {
  console.error("ERROR OAuth: revisa orígenes y redirect en Google Cloud.");
  process.exit(1);
}

console.log("OK: cliente activo para Firebase Auth:", clientId);
