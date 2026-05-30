import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_GATE_COOKIE,
  ADMIN_GATE_MAX_AGE_SEC,
  getAdminGatePassword,
} from "@/lib/admin/gate";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const password = body.password?.trim() ?? "";
  if (!password) {
    return NextResponse.json({ error: "Contraseña requerida" }, { status: 400 });
  }

  if (password !== getAdminGatePassword()) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_GATE_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_GATE_MAX_AGE_SEC,
  });
  return res;
}
