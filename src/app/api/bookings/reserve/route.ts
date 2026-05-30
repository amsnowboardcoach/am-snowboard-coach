import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getMaxParticipants,
  getSessionDuration,
  sessionTotalCents,
  sessionTotalEuros,
  type SessionDurationId,
} from "@/constants/session-schedules";
import {
  formatDaysPlanLabel,
  type BookingDaysPlan,
} from "@/constants/booking-plan";
import { LESSON_TYPES } from "@/constants/lesson-types";
import {
  BOOKING_BALANCE_ON_SLOPE,
  BOOKING_DEPOSIT_PERCENT,
  type BookingPaymentOption,
  isOnlinePaymentOption,
} from "@/constants/booking-payment";
import { computeBookingPaymentBreakdown } from "@/lib/booking/payment-amounts";
import { getAvailableSlots } from "@/lib/booking/schedule";
import { isStripeConfigured } from "@/lib/stripe/config";
import { createGroupBookingCheckoutSession } from "@/lib/stripe/checkout";
import { createBookingFromWeb } from "@/lib/firebase/bookings-admin";
import { isGoogleCalendarConfigured } from "@/lib/google/calendar";
import { sendBookingRequestEmails } from "@/lib/email/send-booking";
import { notifyCoachNewBookingRequest } from "@/lib/push/send-push";
import { requireBookingStudent } from "@/lib/auth/resolve-booking-student";
import { addDays } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { formatBookingInTimeZone } from "@/lib/booking/format-datetime";
import { BOOKING_TIMEZONE } from "@/lib/booking/timezone";
import { z } from "zod";

export const runtime = "nodejs";

const sessionItemSchema = z.object({
  slotId: z.string().min(1),
  startUtc: z.string().min(1),
});

const bodySchema = z
  .object({
    durationId: z.enum(["2h", "3h", "full-day"]),
    sessions: z.array(sessionItemSchema).min(1).max(5).optional(),
    slotId: z.string().min(1).optional(),
    startUtc: z.string().min(1).optional(),
    name: z.string().min(2),
    email: z.string().email(),
    lessonTypeId: z.string().optional(),
    notes: z.string().max(2000).optional(),
    participantCount: z.coerce.number().int().min(1).max(8).optional(),
    daysPlan: z.enum(["single", "consecutive", "spread"]).optional(),
    paymentOption: z.enum(["deposit_30", "full_stripe", "after_confirm"]).optional(),
  })
  .refine(
    (d) =>
      (d.sessions && d.sessions.length > 0) ||
      (Boolean(d.slotId) && Boolean(d.startUtc)),
    { message: "Indica al menos una fecha de clase" },
  );

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

  const {
    durationId,
    sessions: sessionsRaw,
    slotId: legacySlotId,
    startUtc: legacyStartUtc,
    name,
    email,
    lessonTypeId,
    notes,
    participantCount: participantCountRaw,
    daysPlan: daysPlanRaw,
    paymentOption: paymentOptionRaw,
  } = parsed.data;

  const paymentOption: BookingPaymentOption =
    paymentOptionRaw ?? "deposit_30";

  const sessionsInput =
    sessionsRaw ??
    (legacySlotId && legacyStartUtc
      ? [{ slotId: legacySlotId, startUtc: legacyStartUtc }]
      : []);

  if (!isGoogleCalendarConfigured()) {
    return NextResponse.json(
      { error: "Sistema de reservas no configurado (Google Calendar)" },
      { status: 503 },
    );
  }

  const session = getSessionDuration(durationId as SessionDurationId);
  if (!session) {
    return NextResponse.json({ error: "Duración inválida" }, { status: 400 });
  }

  const participantCount = participantCountRaw ?? 1;
  const maxParticipants = getMaxParticipants(durationId as SessionDurationId);
  if (participantCount > maxParticipants) {
    return NextResponse.json(
      {
        error: `Máximo ${maxParticipants} personas en pista para esta modalidad`,
      },
      { status: 400 },
    );
  }

  const daysPlan: BookingDaysPlan =
    daysPlanRaw ?? (sessionsInput.length > 1 ? "spread" : "single");
  const daysPlanLabel = formatDaysPlanLabel(daysPlan, sessionsInput.length);

  const lesson = lessonTypeId
    ? LESSON_TYPES.find((l) => l.id === lessonTypeId)
    : null;

  const studentResult = await requireBookingStudent(request, name);
  if ("error" in studentResult) {
    return NextResponse.json(
      { error: studentResult.error },
      { status: studentResult.status },
    );
  }
  const { studentName, studentEmail, authUserId } = studentResult;

  const perClassEuros = sessionTotalEuros(session, participantCount);
  const groupId = randomUUID();

  try {
    const bookingIds: string[] = [];
    const emailSessions: {
      slotLabel: string;
      startAt: Date;
      endAt: Date;
    }[] = [];

    for (let i = 0; i < sessionsInput.length; i++) {
      const item = sessionsInput[i]!;
      const slot = session.slots.find((s) => s.id === item.slotId);
      if (!slot) {
        return NextResponse.json({ error: "Turno inválido" }, { status: 400 });
      }

      const startAt = new Date(item.startUtc);
      const endAt = new Date(
        startAt.getTime() + session.durationMinutes * 60 * 1000,
      );

      const startDate = formatInTimeZone(startAt, BOOKING_TIMEZONE, "yyyy-MM-dd");
      const endDate = formatInTimeZone(
        addDays(startAt, 1),
        BOOKING_TIMEZONE,
        "yyyy-MM-dd",
      );
      const available = await getAvailableSlots(
        session,
        startDate,
        endDate,
        item.slotId,
      );
      const match = available.find((a) => a.startUtc === item.startUtc);
      if (!match) {
        return NextResponse.json(
          {
            error: `El turno del ${formatBookingInTimeZone(startAt, "d/M/yyyy")} ya no está disponible. Actualiza las fechas.`,
          },
          { status: 409 },
        );
      }

      const noteParts = [
        `Ref. ${groupId.slice(0, 8)}`,
        daysPlanLabel,
        sessionsInput.length > 1
          ? `Día ${i + 1}/${sessionsInput.length}`
          : null,
        lesson ? `Estilo: ${lesson.name}` : null,
        notes?.trim() || null,
      ].filter(Boolean);
      const bookingNotes = noteParts.join(" · ");

      const lessonTypeName = lesson?.name ?? session.name;

      let bookingId: string;
      try {
        bookingId = await createBookingFromWeb({
          session,
          slotId: item.slotId,
          slotLabel: slot.label,
          lessonTypeId: lesson?.id ?? session.id,
          lessonTypeName,
          studentDisplayName: studentName,
          studentEmail,
          startAt,
          endAt,
          participantCount,
          notes: bookingNotes,
          authUserId,
          paymentOption,
          paymentGroupId: groupId,
        });
      } catch (dbErr) {
        console.error("[reserve] Firestore:", dbErr);
        return NextResponse.json(
          {
            error:
              dbErr instanceof Error
                ? dbErr.message
                : "No se pudo registrar la solicitud",
          },
          { status: 500 },
        );
      }

      bookingIds.push(bookingId);
      emailSessions.push({ slotLabel: slot.label, startAt, endAt });
    }

    const totalEuros = perClassEuros * sessionsInput.length;
    const totalAmountCents =
      sessionsInput.length *
      sessionTotalCents(session, participantCount);
    const paymentBreakdown = computeBookingPaymentBreakdown(
      totalAmountCents,
      paymentOption,
    );
    const first = emailSessions[0]!;

    let checkoutUrl: string | undefined;
    if (isOnlinePaymentOption(paymentOption) && isStripeConfigured()) {
      try {
        checkoutUrl = await createGroupBookingCheckoutSession({
          bookingIds,
          paymentGroupId: groupId,
          paymentOption,
          chargeAmountCents: paymentBreakdown.chargeAmountCents,
          totalAmountCents: paymentBreakdown.totalAmountCents,
          session,
          lessonTypeName: lesson?.name ?? session.name,
          studentName,
          studentEmail,
          firstStartAt: first.startAt,
          firstSlotLabel: first.slotLabel,
          participantCount,
          dayCount: sessionsInput.length,
        });
      } catch (stripeErr) {
        console.error("[reserve] Stripe:", stripeErr);
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
    } else if (isOnlinePaymentOption(paymentOption)) {
      return NextResponse.json(
        {
          error:
            "Los pagos con tarjeta no están disponibles. Elige otra forma de pago o contacta por WhatsApp.",
        },
        { status: 503 },
      );
    }

    try {
      await sendBookingRequestEmails({
        studentName,
        studentEmail,
        session,
        slotLabel: first.slotLabel,
        startAt: first.startAt,
        endAt: first.endAt,
        lessonTypeName: lesson?.name ?? session.name,
        notes: notes?.trim() || undefined,
        participantCount,
        totalEuros,
        isRegisteredStudent: true,
        sessions: emailSessions.length > 1 ? emailSessions : undefined,
        daysPlanLabel,
        paymentOption,
        chargeEuros: Math.round(paymentBreakdown.chargeAmountCents / 100),
        balanceEuros: Math.round(paymentBreakdown.balanceAmountCents / 100),
      });
    } catch (mailErr) {
      console.error("[reserve] Email:", mailErr);
    }

    try {
      await notifyCoachNewBookingRequest({
        studentName,
        slotLabel:
          sessionsInput.length > 1
            ? `${sessionsInput.length} clases`
            : first.slotLabel,
        dateLabel:
          sessionsInput.length > 1
            ? formatDaysPlanLabel(daysPlan, sessionsInput.length)
            : formatBookingInTimeZone(first.startAt, "EEE d MMM"),
        bookingId: bookingIds[0]!,
        kind: "session",
        startAt: first.startAt,
        endAt: first.endAt,
      });
    } catch (pushErr) {
      console.error("[reserve] Push:", pushErr);
    }

    const chargeEuros = Math.round(paymentBreakdown.chargeAmountCents / 100);
    const balanceEuros = Math.round(paymentBreakdown.balanceAmountCents / 100);

    return NextResponse.json({
      success: true,
      bookingId: bookingIds[0],
      bookingIds,
      checkoutUrl,
      totalEuros,
      chargeEuros,
      balanceEuros,
      paymentOption,
      dayCount: sessionsInput.length,
      pending: true,
      message: checkoutUrl
        ? paymentOption === "deposit_30"
          ? `Completa el pago de la señal (${BOOKING_DEPOSIT_PERCENT}% = ${chargeEuros} €) con tarjeta. El resto (${balanceEuros} €) en ${BOOKING_BALANCE_ON_SLOPE}. Alejandro confirmará tu plaza.`
          : `Completa el pago total (${chargeEuros} €) con tarjeta. Alejandro confirmará tu plaza.`
        : sessionsInput.length > 1
          ? `Solicitud de ${sessionsInput.length} clases enviada. Alejandro confirmará cada día.`
          : "Solicitud enviada. Alejandro confirmará tu clase.",
    });
  } catch (err) {
    console.error("[reserve]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "No se pudo completar la solicitud",
      },
      { status: 502 },
    );
  }
}
