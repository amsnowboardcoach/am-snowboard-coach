import { NextRequest, NextResponse } from "next/server";
import { verifyCoachRequest } from "@/lib/auth/verify-coach";
import { markSessionPaidAndFormalizeByCoach } from "@/lib/firebase/bookings-admin";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ bookingId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const coachUid = await verifyCoachRequest(request);
  if (!coachUid) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { bookingId } = await context.params;
  if (!bookingId) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    const result = await markSessionPaidAndFormalizeByCoach(bookingId);
    return NextResponse.json({
      success: true,
      message:
        result.warnings.length > 0
          ? "Pago registrado y reserva aceptada. Revisa los avisos."
          : "Pago registrado y reserva aceptada en el calendario.",
      warnings: result.warnings,
    });
  } catch (err) {
    console.error("[mark-paid]", err);
    const msg = err instanceof Error ? err.message : "Error al registrar pago";
    const status =
      msg.includes("no encontrada") || msg.includes("video") ? 409 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
