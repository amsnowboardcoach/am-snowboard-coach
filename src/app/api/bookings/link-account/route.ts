import { NextRequest, NextResponse } from "next/server";
import { verifyUserBearer } from "@/lib/auth/verify-user-token";
import { linkAlumnoBookingsToUser } from "@/lib/firebase/bookings-admin";
import { getAdminDb } from "@/lib/firebase/admin";
import { isAlumnoRole, LEGACY_ALUMNO_ROLE } from "@/constants/roles";
import { isCoachEmail } from "@/lib/auth/config";

export const runtime = "nodejs";

/** Vincula reservas del email del alumno a su UID (reservas antiguas sin userId). */
export async function POST(request: NextRequest) {
  const auth = await verifyUserBearer(request);
  if (!auth) {
    return NextResponse.json(
      { error: "Debes iniciar sesión." },
      { status: 401 },
    );
  }

  if (isCoachEmail(auth.email)) {
    return NextResponse.json({ linked: 0 });
  }

  const userSnap = await getAdminDb().collection("users").doc(auth.uid).get();
  const role = userSnap.data()?.role as string | undefined;
  if (role && !isAlumnoRole(role) && role !== LEGACY_ALUMNO_ROLE) {
    return NextResponse.json(
      { error: "Solo cuentas de alumno." },
      { status: 403 },
    );
  }

  try {
    const linked = await linkAlumnoBookingsToUser(auth.uid, auth.email);
    return NextResponse.json({ linked });
  } catch (err) {
    console.error("[link-account]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudieron vincular las reservas",
      },
      { status: 500 },
    );
  }
}
