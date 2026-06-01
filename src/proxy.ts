import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/perfil", "/coach"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  // Fase 1: la protección real se hace en cliente con Firebase Auth.
  // En fase 2 añadiremos session cookies con Firebase Admin.
  return NextResponse.next();
}

export const config = {
  matcher: ["/perfil/:path*", "/coach/:path*"],
};
