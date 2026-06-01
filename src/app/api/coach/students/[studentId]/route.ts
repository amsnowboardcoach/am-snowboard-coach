import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyCoachRequest } from "@/lib/auth/verify-coach";
import { assertCoachCanManageStudent } from "@/lib/firebase/coach-student-access";
import {
  assertCoachCanDeleteStudent,
  deleteUserAccountCompletely,
} from "@/lib/firebase/delete-user-account";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const patchBodySchema = z.object({
  level: z
    .enum(["beginner", "intermediate", "advanced"])
    .nullable()
    .optional(),
});

type RouteContext = { params: Promise<{ studentId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const coachUid = await verifyCoachRequest(request);
  if (!coachUid) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { studentId } = await context.params;
  if (!studentId?.trim()) {
    return NextResponse.json({ error: "Alumno no válido" }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = patchBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  if (parsed.data.level === undefined) {
    return NextResponse.json({ error: "Falta el campo level" }, { status: 400 });
  }

  try {
    await assertCoachCanManageStudent(coachUid, studentId);
    const ref = getAdminDb().collection("users").doc(studentId);
    if (parsed.data.level === null) {
      await ref.update({
        level: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await ref.update({
        level: parsed.data.level,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return NextResponse.json({ ok: true, level: parsed.data.level });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al actualizar nivel";
    const status =
      msg.includes("no encontrado") ? 404 : msg.includes("asignado") ? 403 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const coachUid = await verifyCoachRequest(request);
  if (!coachUid) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { studentId } = await context.params;
  if (!studentId?.trim()) {
    return NextResponse.json({ error: "Alumno no válido" }, { status: 400 });
  }

  try {
    await assertCoachCanDeleteStudent(coachUid, studentId);
    const result = await deleteUserAccountCompletely(studentId);
    return NextResponse.json({
      ok: true,
      message: "Alumno eliminado",
      deleted: result,
    });
  } catch (err) {
    const msg = formatDeleteStudentError(err);
    const status = msg.includes("no encontrado")
      ? 404
      : msg.includes("autorizado") || msg.includes("asignado")
        ? 403
        : 500;
    console.error("[coach/students/delete]", studentId, err);
    return NextResponse.json({ error: msg }, { status });
  }
}

function formatDeleteStudentError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes("FAILED_PRECONDITION")) {
      return "Error de base de datos al eliminar. Contacta soporte si persiste.";
    }
    return err.message;
  }
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  if (code === "9" || code === "failed-precondition") {
    return "Error de base de datos al eliminar. Contacta soporte si persiste.";
  }
  return "Error al eliminar alumno";
}
