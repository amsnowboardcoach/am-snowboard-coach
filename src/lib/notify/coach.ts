import { formatBookingWhen } from "@/lib/booking/format-datetime";
import type { BookingPaymentOption } from "@/constants/booking-payment";
import { VIDEO_CORRECTION_PRODUCT } from "@/constants/video-correction";
import { getAppBaseUrl } from "@/constants/project";
import {
  sendCoachBookingPaidAwaitingApprovalEmail,
  sendCoachVideoBookingPaidAwaitingApprovalEmail,
  sendVideoCorrectionPaymentReceivedEmail,
  type BookingEmailDetails,
  type BookingEmailSessionLine,
} from "@/lib/email/send-booking";
import {
  sendCoachNewAlumnoRegisteredEmail,
  sendCoachNewSessionBookingEmail,
  sendCoachVideoCorrectionRequestEmail,
  sendCoachVideoUploadedEmail,
} from "@/lib/email/send-coach-alerts";
import {
  notifyAfterBookingPaid,
  notifyCoachNewBookingRequest,
  notifyCoachNewAlumnoRegistered,
  notifyCoachAlumnoVideoUploaded,
} from "@/lib/push/send-push";
import type { SessionDuration } from "@/constants/session-schedules";
import {
  buildCoachNewSessionBookingWhatsApp,
  buildCoachAlumnoRegisteredWhatsApp,
  buildCoachVideoBookingPaidWhatsApp,
  buildCoachVideoCorrectionRequestWhatsApp,
  buildCoachVideoUploadedWhatsApp,
  sendCoachBookingPaidWhatsApp,
  sendCoachWhatsAppMessage,
} from "@/lib/whatsapp/coach-notify";

async function runCoachNotifications(
  label: string,
  tasks: Array<() => Promise<void>>,
): Promise<boolean> {
  const results = await Promise.allSettled(tasks.map((t) => t()));
  let anyOk = false;
  for (const r of results) {
    if (r.status === "fulfilled") {
      anyOk = true;
    } else {
      console.error(`[notify-coach] ${label}:`, r.reason);
    }
  }
  return anyOk;
}

/** Registro de alumno: push + email + WhatsApp */
export async function coachNotifyAlumnoRegistered(details: {
  alumnoName: string;
  alumnoEmail: string;
  alumnoId: string;
}): Promise<boolean> {
  return runCoachNotifications("alumno-registered", [
    () =>
      notifyCoachNewAlumnoRegistered({
        alumnoName: details.alumnoName,
        alumnoEmail: details.alumnoEmail,
        alumnoId: details.alumnoId,
      }),
    () =>
      sendCoachNewAlumnoRegisteredEmail({
        alumnoName: details.alumnoName,
        alumnoEmail: details.alumnoEmail,
      }),
    () =>
      sendCoachWhatsAppMessage(
        buildCoachAlumnoRegisteredWhatsApp({
          alumnoName: details.alumnoName,
          alumnoEmail: details.alumnoEmail,
        }),
      ),
  ]);
}

/** Nueva reserva de clase en pista (solo si el pago no es online pendiente en Stripe). */
export async function coachNotifyNewSessionBooking(details: {
  alumnoName: string;
  alumnoEmail: string;
  lessonTypeName: string;
  sessionLabel: string;
  slotLabel: string;
  startAt: Date;
  endAt: Date;
  totalEuros: number;
  paymentPending?: boolean;
  bookingId: string;
  bookingNotes?: string;
  participantCount?: number;
}): Promise<void> {
  const when = formatBookingWhen(details.startAt, details.endAt);
  const panelUrl = `${getAppBaseUrl()}/coach?tab=reservas`;

  await runCoachNotifications("new-session-booking", [
    () =>
      notifyCoachNewBookingRequest({
        alumnoName: details.alumnoName,
        slotLabel: details.slotLabel,
        dateLabel: when,
        bookingId: details.bookingId,
        kind: "session",
        startAt: details.startAt,
        endAt: details.endAt,
      }),
    () =>
      sendCoachNewSessionBookingEmail({
        alumnoName: details.alumnoName,
        alumnoEmail: details.alumnoEmail,
        lessonTypeName: details.lessonTypeName,
        sessionLabel: details.sessionLabel,
        when,
        totalEuros: details.totalEuros,
        paymentPending: details.paymentPending,
        bookingNotes: details.bookingNotes,
        participantCount: details.participantCount,
        panelUrl,
      }),
    () =>
      sendCoachWhatsAppMessage(
        buildCoachNewSessionBookingWhatsApp({
          alumnoName: details.alumnoName,
          alumnoEmail: details.alumnoEmail,
          lessonTypeName: details.lessonTypeName,
          sessionLabel: details.sessionLabel,
          startAt: details.startAt,
          endAt: details.endAt,
          totalEuros: details.totalEuros,
          paymentPending: details.paymentPending,
          bookingId: details.bookingId,
          bookingNotes: details.bookingNotes,
        }),
      ),
  ]);
}

/** Clase en pista: alumno pagó señal o total — el coach puede aceptar o rechazar */
export async function coachNotifySessionBookingPaidAwaitingApproval(details: {
  bookingId: string;
  userId: string;
  alumnoName: string;
  alumnoEmail: string;
  lessonTypeId: string;
  lessonTypeName: string;
  session: SessionDuration;
  slotLabel: string;
  startAt: Date;
  endAt: Date;
  participantCount?: number;
  bookingNotes?: string;
  paymentOption?: BookingPaymentOption;
  totalEuros: number;
  chargeEuros: number;
  balanceEuros: number;
  chargeAmountCents: number;
  sessions?: BookingEmailSessionLine[];
  daysPlanLabel?: string;
}): Promise<void> {
  const emailDetails: BookingEmailDetails & { chargeEuros: number } = {
    alumnoName: details.alumnoName,
    alumnoEmail: details.alumnoEmail,
    session: details.session,
    slotLabel: details.slotLabel,
    startAt: details.startAt,
    endAt: details.endAt,
    lessonTypeName: details.lessonTypeName,
    notes: details.bookingNotes,
    participantCount: details.participantCount,
    totalEuros: details.totalEuros,
    paidWithCard: true,
    paymentOption: details.paymentOption,
    chargeEuros: details.chargeEuros,
    balanceEuros: details.balanceEuros,
    isRegisteredAlumno: Boolean(details.userId?.trim()),
    sessions: details.sessions,
    daysPlanLabel: details.daysPlanLabel,
  };

  await runCoachNotifications("session-booking-paid", [
    () => sendCoachBookingPaidAwaitingApprovalEmail(emailDetails),
    () =>
      sendCoachBookingPaidWhatsApp({
        bookingId: details.bookingId,
        alumnoName: details.alumnoName,
        alumnoEmail: details.alumnoEmail,
        lessonTypeName: details.lessonTypeName,
        sessionLabel: details.session.name,
        startAt: details.startAt,
        endAt: details.endAt,
        participantCount: details.participantCount,
        chargeEuros: details.chargeEuros,
        totalEuros: details.totalEuros,
        balanceEuros: details.balanceEuros,
        paymentOption: details.paymentOption,
        bookingNotes: details.bookingNotes,
        sessions: details.sessions,
      }),
    () =>
      notifyAfterBookingPaid({
        id: details.bookingId,
        userId: details.userId,
        alumnoDisplayName: details.alumnoName,
        alumnoEmail: details.alumnoEmail,
        lessonTypeId: details.lessonTypeId,
        lessonTypeName: details.lessonTypeName,
        sessionDurationId: details.session.id,
        sessionSlotLabel: details.slotLabel,
        startAt: details.startAt,
        endAt: details.endAt,
        amountCents: details.chargeAmountCents,
      }),
  ]);
}

/** Video corrección: alumno pagó — el coach puede aceptar o rechazar */
export async function coachNotifyVideoBookingPaidAwaitingApproval(details: {
  bookingId: string;
  userId: string;
  alumnoName: string;
  alumnoEmail: string;
  videoCount: number;
  totalEuros: number;
  notes?: string;
  amountCents: number;
}): Promise<void> {
  const label = `${details.videoCount} vídeo${details.videoCount > 1 ? "s" : ""}`;

  await runCoachNotifications("video-booking-paid", [
    () =>
      sendCoachVideoBookingPaidAwaitingApprovalEmail({
        alumnoName: details.alumnoName,
        alumnoEmail: details.alumnoEmail,
        videoCount: details.videoCount,
        totalEuros: details.totalEuros,
        notes: details.notes,
      }),
    () =>
      sendCoachWhatsAppMessage(
        buildCoachVideoBookingPaidWhatsApp({
          alumnoName: details.alumnoName,
          alumnoEmail: details.alumnoEmail,
          videoCount: details.videoCount,
          totalEuros: details.totalEuros,
          bookingId: details.bookingId,
          notes: details.notes,
        }),
      ),
    () =>
      details.alumnoEmail
        ? sendVideoCorrectionPaymentReceivedEmail({
            alumnoName: details.alumnoName,
            alumnoEmail: details.alumnoEmail,
            videoCount: details.videoCount,
            totalEuros: details.totalEuros,
            notes: details.notes,
          })
        : Promise.resolve(),
    () =>
      notifyAfterBookingPaid({
        id: details.bookingId,
        userId: details.userId,
        alumnoDisplayName: details.alumnoName,
        alumnoEmail: details.alumnoEmail,
        lessonTypeId: VIDEO_CORRECTION_PRODUCT.id,
        lessonTypeName: VIDEO_CORRECTION_PRODUCT.name,
        productKind: "video_correction",
        videoCount: details.videoCount,
        sessionDurationId: null,
        sessionSlotLabel: label,
        startAt: new Date(),
        endAt: new Date(),
        amountCents: details.amountCents,
      }),
  ]);
}

/** Nueva solicitud de video corrección sin pago (legacy / manual) */
export async function coachNotifyVideoCorrectionBooking(details: {
  alumnoName: string;
  alumnoEmail: string;
  videoCount: number;
  totalEuros: number;
  bookingId: string;
  notes?: string;
}): Promise<void> {
  const panelUrl = `${getAppBaseUrl()}/coach?tab=reservas`;
  const label = `${details.videoCount} vídeo${details.videoCount > 1 ? "s" : ""}`;

  await runCoachNotifications("video-correction-booking", [
    () =>
      notifyCoachNewBookingRequest({
        alumnoName: details.alumnoName,
        slotLabel: label,
        dateLabel: "Video corrección",
        bookingId: details.bookingId,
        kind: "video_correction",
        videoCount: details.videoCount,
      }),
    () =>
      sendCoachVideoCorrectionRequestEmail({
        alumnoName: details.alumnoName,
        alumnoEmail: details.alumnoEmail,
        videoCount: details.videoCount,
        totalEuros: details.totalEuros,
        notes: details.notes,
        panelUrl,
      }),
    () =>
      sendCoachWhatsAppMessage(
        buildCoachVideoCorrectionRequestWhatsApp({
          alumnoName: details.alumnoName,
          alumnoEmail: details.alumnoEmail,
          videoCount: details.videoCount,
          totalEuros: details.totalEuros,
          bookingId: details.bookingId,
          notes: details.notes,
        }),
      ),
  ]);
}

/** Alumno subió vídeo en su área (corrección) */
export async function coachNotifyVideoUploaded(details: {
  alumnoName: string;
  alumnoEmail: string;
  videoTitle: string;
  alumnoId: string;
}): Promise<void> {
  const panelUrl = `${getAppBaseUrl()}/coach/alumnos/${details.alumnoId}`;

  await runCoachNotifications("video-uploaded", [
    () =>
      notifyCoachAlumnoVideoUploaded({
        alumnoName: details.alumnoName,
        videoTitle: details.videoTitle,
        alumnoId: details.alumnoId,
      }),
    () =>
      sendCoachVideoUploadedEmail({
        alumnoName: details.alumnoName,
        alumnoEmail: details.alumnoEmail,
        videoTitle: details.videoTitle,
        panelUrl,
      }),
    () =>
      sendCoachWhatsAppMessage(
        buildCoachVideoUploadedWhatsApp({
          alumnoName: details.alumnoName,
          videoTitle: details.videoTitle,
          alumnoId: details.alumnoId,
        }),
      ),
  ]);
}
