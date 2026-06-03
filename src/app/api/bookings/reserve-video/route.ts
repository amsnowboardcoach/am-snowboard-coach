import { NextRequest, NextResponse } from "next/server";
import {
  VIDEO_CORRECTION_PRODUCT,
  videoCorrectionTotalCents,
  videoCorrectionTotalEuros,
} from "@/constants/video-correction";
import { createVideoCorrectionBookingFromWeb } from "@/lib/firebase/bookings-admin";
import { sendVideoCorrectionRequestEmails } from "@/lib/email/send-booking";
import { isStripeConfigured } from "@/lib/stripe/config";
import { createBookingCheckoutSession } from "@/lib/stripe/checkout";
import { getAppBaseUrl } from "@/constants/project";
import { z } from "zod";
import { requireBookingAlumno } from "@/lib/auth/resolve-booking-alumno";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  videoCount: z.coerce
    .number()
    .int()
    .min(VIDEO_CORRECTION_PRODUCT.minQuantity)
    .max(VIDEO_CORRECTION_PRODUCT.maxQuantity),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, videoCount, notes } = parsed.data;
  const alumnoResult = await requireBookingAlumno(request, name);
  if ("error" in alumnoResult) {
    return NextResponse.json(
      { error: alumnoResult.error },
      { status: alumnoResult.status },
    );
  }
  const { alumnoName, alumnoEmail, authUserId } = alumnoResult;
  const totalEuros = videoCorrectionTotalEuros(videoCount);
  const amountCents = videoCorrectionTotalCents(videoCount);
  const label = `${videoCount} vídeo${videoCount > 1 ? "s" : ""}`;

  try {
    const bookingId = await createVideoCorrectionBookingFromWeb({
      alumnoDisplayName: alumnoName,
      alumnoEmail,
      videoCount,
      notes,
      authUserId,
    });

    let checkoutUrl: string | undefined;
    if (isStripeConfigured()) {
      const base = getAppBaseUrl();
      const now = new Date();
      try {
        checkoutUrl = await createBookingCheckoutSession({
          bookingId,
          slotLabel: label,
          lessonTypeName: VIDEO_CORRECTION_PRODUCT.name,
          alumnoName,
          alumnoEmail,
          startAt: now,
          amountCents,
          productTitle: VIDEO_CORRECTION_PRODUCT.name,
          productDescription: `${label} · ${VIDEO_CORRECTION_PRODUCT.priceEuros} €/vídeo · ${totalEuros} € total`,
          successUrl: `${base}/reservar?tipo=video&paid=1&booking=${bookingId}`,
          cancelUrl: `${base}/reservar?tipo=video&cancelled=1&booking=${bookingId}`,
        });
      } catch (stripeErr) {
        console.error("[reserve-video] Stripe:", stripeErr);
        return NextResponse.json(
          {
            error:
              stripeErr instanceof Error
                ? stripeErr.message
                : "No se pudo iniciar el pago con tarjeta",
          },
          { status: 502 },
        );
      }
    } else {
      return NextResponse.json(
        {
          error:
            "Los pagos con tarjeta no están disponibles. Contacta por WhatsApp.",
        },
        { status: 503 },
      );
    }

    try {
      await sendVideoCorrectionRequestEmails({
        alumnoName,
        alumnoEmail,
        videoCount,
        totalEuros,
        notes,
      });
    } catch (mailErr) {
      console.error("[reserve-video] Email:", mailErr);
    }

    return NextResponse.json({
      success: true,
      bookingId,
      checkoutUrl,
      totalEuros,
      videoCount,
      message: `Completa el pago de ${totalEuros} € con tarjeta. Alejandro aceptará tu solicitud después del pago.`,
    });
  } catch (err) {
    console.error("[reserve-video]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudo registrar la solicitud",
      },
      { status: 502 },
    );
  }
}
