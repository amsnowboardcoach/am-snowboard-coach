import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

export const runtime = "nodejs";

const REDIRECT_PATH = "/api/auth/google/callback";

function envLocalPath(): string {
  return join(process.cwd(), ".env.local");
}

function saveRefreshToken(token: string): void {
  const path = envLocalPath();
  if (!existsSync(path)) throw new Error("No existe .env.local");
  let text = readFileSync(path, "utf8");
  if (/^GOOGLE_REFRESH_TOKEN=/m.test(text)) {
    text = text.replace(/^GOOGLE_REFRESH_TOKEN=.*$/m, `GOOGLE_REFRESH_TOKEN=${token}`);
  } else {
    text += `\nGOOGLE_REFRESH_TOKEN=${token}\n`;
  }
  writeFileSync(path, text, "utf8");
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const err = request.nextUrl.searchParams.get("error");

  if (err) {
    return html(
      400,
      `Google devolvió error: ${err}. Revisa la URI de redirección en Cloud Console.`,
    );
  }

  if (!code) {
    return html(400, "Falta el código de autorización.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}${REDIRECT_PATH}`;

  if (!clientId || !clientSecret) {
    return html(500, "Faltan GOOGLE_CLIENT_ID o GOOGLE_CLIENT_SECRET en .env.local");
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = (await tokenRes.json()) as {
      refresh_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokens.refresh_token) {
      const detail =
        tokens.error_description ?? tokens.error ?? JSON.stringify(tokens);
      return html(
        400,
        `Sin refresh_token. Revoca el acceso de la app en Google → Seguridad → Acceso de terceros, y repite. Detalle: ${detail}`,
      );
    }

    saveRefreshToken(tokens.refresh_token);

    return html(
      200,
      "Calendar conectado. GOOGLE_REFRESH_TOKEN guardado en .env.local. Puedes cerrar esta ventana y probar /reservar.",
    );
  } catch (e) {
    console.error("[google/callback]", e);
    return html(500, e instanceof Error ? e.message : "Error al obtener tokens");
  }
}

function html(status: number, message: string) {
  const body = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>AM Snowboard Coach</title></head><body style="font-family:system-ui;max-width:32rem;margin:2rem auto;padding:0 1rem"><h1>${status === 200 ? "OK" : "Error"}</h1><p>${message}</p></body></html>`;
  return new NextResponse(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
