import { NextRequest, NextResponse } from "next/server";
import { verifyCoachRequest } from "@/lib/auth/verify-coach";
import { confirmBookingByCoach } from "@/lib/firebase/bookings-admin";

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
    const result = await confirmBookingByCoach(bookingId);
    return NextResponse.json({
      success: true,
      message:
        result.warnings.length > 0
          ? "Reserva aceptada. Revisa los avisos siguientes."
          : "Reserva aceptada. Calendario y avisos al alumno enviados.",
      warnings: result.warnings,
    });
  } catch (err) {
    console.error("[confirm]", err);
    const msg = err instanceof Error ? err.message : "Error al confirmar";
    const status =
      msg.includes("no encontrada") || msg.includes("pendiente") ? 409 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
