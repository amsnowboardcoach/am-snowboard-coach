import { NextRequest, NextResponse } from "next/server";
import {
  VIDEO_CORRECTION_PRODUCT,
  videoCorrectionTotalEuros,
} from "@/constants/video-correction";
import { createVideoCorrectionBookingFromWeb } from "@/lib/firebase/bookings-admin";
import { sendVideoCorrectionRequestEmails } from "@/lib/email/send-booking";
import { notifyCoachNewBookingRequest } from "@/lib/push/send-push";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { z } from "zod";
import { requireBookingStudent } from "@/lib/auth/resolve-booking-student";

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
  const studentResult = await requireBookingStudent(request, name);
  if ("error" in studentResult) {
    return NextResponse.json(
      { error: studentResult.error },
      { status: studentResult.status },
    );
  }
  const { studentName, studentEmail, authUserId } = studentResult;
  const totalEuros = videoCorrectionTotalEuros(videoCount);

  try {
    const bookingId = await createVideoCorrectionBookingFromWeb({
      studentDisplayName: studentName,
      studentEmail,
      videoCount,
      notes,
      authUserId,
    });

    try {
      await sendVideoCorrectionRequestEmails({
        studentName,
        studentEmail,
        videoCount,
        totalEuros,
        notes,
      });
    } catch (mailErr) {
      console.error("[reserve-video] Email:", mailErr);
    }

    try {
      await notifyCoachNewBookingRequest({
        studentName,
        slotLabel: `${videoCount} vídeo${videoCount > 1 ? "s" : ""} a corregir`,
        dateLabel: "Video corrección",
        bookingId,
        kind: "video_correction",
        videoCount,
      });
    } catch (pushErr) {
      console.error("[reserve-video] Push:", pushErr);
    }

    return NextResponse.json({
      success: true,
      bookingId,
      totalEuros,
      videoCount,
      message:
        "Solicitud de video corrección enviada. Te avisaremos por email cuando se confirme.",
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
