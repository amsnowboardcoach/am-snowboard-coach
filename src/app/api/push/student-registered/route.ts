import { NextRequest, NextResponse } from "next/server";
import { ROLES } from "@/constants/roles";
import { isCoachEmail } from "@/lib/auth/config";
import { verifyUserBearer } from "@/lib/auth/verify-user-token";
import { getAdminDb } from "@/lib/firebase/admin";
import { coachNotifyStudentRegistered } from "@/lib/notify/coach";

export const runtime = "nodejs";

const REGISTRATION_WINDOW_MS = 20 * 60 * 1000;

export async function POST(request: NextRequest) {
  const auth = await verifyUserBearer(request);
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userRef = getAdminDb().collection("users").doc(auth.uid);
  let userSnap = await userRef.get();
  for (let i = 0; i < 3 && !userSnap.exists; i++) {
    await new Promise((r) => setTimeout(r, 400));
    userSnap = await userRef.get();
  }
  if (!userSnap.exists) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const data = userSnap.data()!;
  if (data.role !== ROLES.STUDENT || isCoachEmail(data.email as string)) {
    return NextResponse.json({ ok: true, skipped: "not_student" });
  }

  if (data.registrationCoachNotified === true) {
    return NextResponse.json({ ok: true, skipped: "already_notified" });
  }

  const createdAt = data.createdAt?.toDate?.() as Date | undefined;
  if (createdAt) {
    const age = Date.now() - createdAt.getTime();
    if (age > REGISTRATION_WINDOW_MS) {
      return NextResponse.json({ ok: true, skipped: "not_recent" });
    }
  }

  const studentName =
    (data.displayName as string)?.trim() ||
    auth.email.split("@")[0] ||
    "Alumno";
  const studentEmail = (data.email as string) || auth.email;

  try {
    await coachNotifyStudentRegistered({
      studentName,
      studentEmail,
      studentId: auth.uid,
    });
    await userRef.update({ registrationCoachNotified: true });
  } catch (err) {
    console.error("[push/student-registered]", err);
    return NextResponse.json(
      { error: "No se pudo enviar el aviso al coach" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
