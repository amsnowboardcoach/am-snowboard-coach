import { BOOKING_BALANCE_ON_SLOPE } from "@/constants/booking-payment";
import { NextRequest, NextResponse } from "next/server";
import {
  getSessionDuration,
  sessionTotalCents,
  type SessionDurationId,
} from "@/constants/session-schedules";
import {
  VIDEO_CORRECTION_PRODUCT,
  isVideoCorrectionProduct,
} from "@/constants/video-correction";
import { getBookingById } from "@/lib/firebase/bookings-admin";
import { isStripeConfigured } from "@/lib/stripe/config";
import { createBookingCheckoutSession } from "@/lib/stripe/checkout";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ bookingId: string }> };

/** Reintento de pago para una reserva pendiente sin pagar */
export async function POST(
  _request: NextRequest,
  context: RouteContext,
) {
  const { bookingId } = await context.params;

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Pagos con tarjeta no disponibles" },
      { status: 503 },
    );
  }

  const booking = await getBookingById(bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Reserva no encontrada" }, { status: 404 });
  }

  if (
    booking.payment.status === "paid" ||
    booking.payment.status === "deposit_paid"
  ) {
    return NextResponse.json(
      {
        error:
          booking.payment.status === "deposit_paid"
            ? `La señal ya está pagada. El resto se abona en ${BOOKING_BALANCE_ON_SLOPE}.`
            : "Esta reserva ya está pagada",
      },
      { status: 409 },
    );
  }

  if (booking.status === "pending") {
    return NextResponse.json(
      {
        error:
          "La reserva aún no está confirmada por el coach. Recibirás el enlace de pago por email cuando la acepte.",
      },
      { status: 409 },
    );
  }

  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: "Reserva cancelada o no disponible" }, { status: 409 });
  }

  const isVideo =
    booking.productKind === "video_correction" ||
    isVideoCorrectionProduct(booking.lessonTypeId);

  const session = !isVideo
    ? getSessionDuration((booking.sessionDurationId || "2h") as SessionDurationId)
    : undefined;

  if (!isVideo && !session) {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 400 });
  }

  const videoCount = booking.videoCount ?? 1;

  try {
    const checkoutUrl = await createBookingCheckoutSession({
      bookingId: booking.id,
      session,
      slotLabel:
        booking.sessionSlotLabel ||
        (isVideo ? `${videoCount} vídeo${videoCount > 1 ? "s" : ""}` : session!.name),
      lessonTypeName: booking.lessonTypeName,
      studentName:
        booking.studentDisplayName || booking.studentEmail || "Alumno",
      studentEmail: booking.studentEmail || "",
      startAt: booking.startAt,
      amountCents:
        booking.payment.totalAmountCents ??
        booking.payment.amountCents ??
        (isVideo
          ? VIDEO_CORRECTION_PRODUCT.priceCents * videoCount
          : sessionTotalCents(session!, booking.participantCount ?? 1)),
      participantCount: booking.participantCount,
      ...(isVideo
        ? {
            productTitle: VIDEO_CORRECTION_PRODUCT.name,
            productDescription: `${videoCount} vídeo${videoCount > 1 ? "s" : ""} a corregir · ${VIDEO_CORRECTION_PRODUCT.priceEuros} €/vídeo`,
          }
        : {}),
    });
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error("[checkout]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "No se pudo iniciar el pago",
      },
      { status: 502 },
    );
  }
}
