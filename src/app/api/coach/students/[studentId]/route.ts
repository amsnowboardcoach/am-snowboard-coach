import { NextRequest, NextResponse } from "next/server";
import { verifyCoachRequest } from "@/lib/auth/verify-coach";
import {
  assertCoachCanDeleteStudent,
  deleteUserAccountCompletely,
} from "@/lib/firebase/delete-user-account";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ studentId: string }> };

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
    const msg = err instanceof Error ? err.message : "Error al eliminar alumno";
    const status = msg.includes("no encontrado")
      ? 404
      : msg.includes("autorizado") || msg.includes("asignado")
        ? 403
        : 500;
    console.error("[coach/students/delete]", err);
    return NextResponse.json({ error: msg }, { status });
  }
}
