import { NextRequest, NextResponse } from "next/server";
import { verifyCoachRequest } from "@/lib/auth/verify-coach";
import { rejectBookingByCoach } from "@/lib/firebase/bookings-admin";

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
    const result = await rejectBookingByCoach(bookingId);
    const refundNote = result.paymentRefunded
      ? " Se ha iniciado la devolución del pago con tarjeta."
      : "";
    return NextResponse.json({
      success: true,
      message: `Solicitud rechazada.${refundNote}`,
      paymentRefunded: result.paymentRefunded ?? false,
      warnings: result.warnings,
    });
  } catch (err) {
    console.error("[reject]", err);
    const msg = err instanceof Error ? err.message : "Error al rechazar";
    const status =
      msg.includes("no encontrada") || msg.includes("pendiente") ? 409 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
