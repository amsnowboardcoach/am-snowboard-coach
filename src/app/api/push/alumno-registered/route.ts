import { NextRequest, NextResponse } from "next/server";
import { isAlumnoRole } from "@/constants/roles";
import { isCoachEmail } from "@/lib/auth/config";
import { verifyUserBearer } from "@/lib/auth/verify-user-token";
import { getAdminDb } from "@/lib/firebase/admin";
import { coachNotifyAlumnoRegistered } from "@/lib/notify/coach";
import { ALUMNO_REGISTRATION_NOTIFY_WINDOW_MS } from "@/lib/push/alumno-registration-window";

export const runtime = "nodejs";
const PROFILE_WAIT_ATTEMPTS = 16;
const PROFILE_WAIT_MS = 500;

export async function POST(request: NextRequest) {
  const auth = await verifyUserBearer(request);
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userRef = getAdminDb().collection("users").doc(auth.uid);
  let userSnap = await userRef.get();
  for (let i = 0; i < PROFILE_WAIT_ATTEMPTS && !userSnap.exists; i++) {
    await new Promise((r) => setTimeout(r, PROFILE_WAIT_MS));
    userSnap = await userRef.get();
  }
  if (!userSnap.exists) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const data = userSnap.data()!;
  if (!isAlumnoRole(data.role as string) || isCoachEmail(data.email as string)) {
    return NextResponse.json({ ok: true, skipped: "not_alumno" });
  }

  if (data.registrationCoachNotified === true) {
    return NextResponse.json({ ok: true, skipped: "already_notified" });
  }

  const createdAt = data.createdAt?.toDate?.() as Date | undefined;
  if (createdAt) {
    const age = Date.now() - createdAt.getTime();
    if (age > ALUMNO_REGISTRATION_NOTIFY_WINDOW_MS) {
      return NextResponse.json({ ok: true, skipped: "not_recent" });
    }
  }

  const alumnoName =
    (data.displayName as string)?.trim() ||
    auth.email.split("@")[0] ||
    "Alumno";
  const alumnoEmail = (data.email as string) || auth.email;

  try {
    const notified = await coachNotifyAlumnoRegistered({
      alumnoName,
      alumnoEmail,
      alumnoId: auth.uid,
    });
    if (!notified) {
      return NextResponse.json(
        { error: "No se pudo enviar ningún aviso al coach" },
        { status: 503 },
      );
    }
    await userRef.update({ registrationCoachNotified: true });
  } catch (err) {
    console.error("[push/alumno-registered]", err);
    return NextResponse.json(
      { error: "No se pudo enviar el aviso al coach" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
