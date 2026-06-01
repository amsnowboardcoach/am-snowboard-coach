import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyUserBearer } from "@/lib/auth/verify-user-token";
import { COACH_ROLES, ROLES } from "@/constants/roles";
import { getAdminDb } from "@/lib/firebase/admin";
import { deleteUserAccountCompletely } from "@/lib/firebase/delete-user-account";

export const runtime = "nodejs";

const bodySchema = z.object({
  confirmPhrase: z.string().min(1),
});

const CONFIRM_TEXT = "ELIMINAR";

export async function POST(request: NextRequest) {
  const auth = await verifyUserBearer(request);
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  if (parsed.data.confirmPhrase.trim().toUpperCase() !== CONFIRM_TEXT) {
    return NextResponse.json(
      {
        error: `Escribe ${CONFIRM_TEXT} para confirmar la eliminación`,
      },
      { status: 400 },
    );
  }

  const userSnap = await getAdminDb().collection("users").doc(auth.uid).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 });
  }

  const role = userSnap.data()?.role as string | undefined;
  if (role && COACH_ROLES.includes(role as (typeof COACH_ROLES)[number])) {
    return NextResponse.json(
      {
        error:
          "Las cuentas de coach no se eliminan desde aquí. Contacta con soporte si necesitas cerrar tu acceso.",
      },
      { status: 403 },
    );
  }

  if (role !== ROLES.STUDENT) {
    return NextResponse.json(
      { error: "Solo los alumnos pueden eliminar su cuenta desde el área privada" },
      { status: 403 },
    );
  }

  try {
    const result = await deleteUserAccountCompletely(auth.uid);
    return NextResponse.json({
      ok: true,
      message: "Cuenta eliminada",
      deleted: result,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al eliminar la cuenta";
    console.error("[account/delete]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
