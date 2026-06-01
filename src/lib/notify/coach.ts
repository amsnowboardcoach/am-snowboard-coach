import { formatBookingWhen } from "@/lib/booking/format-datetime";
import { getAppBaseUrl } from "@/constants/project";
import {
  sendCoachNewStudentRegisteredEmail,
  sendCoachNewSessionBookingEmail,
  sendCoachVideoCorrectionRequestEmail,
  sendCoachVideoUploadedEmail,
} from "@/lib/email/send-coach-alerts";
import {
  notifyCoachNewBookingRequest,
  notifyCoachNewStudentRegistered,
  notifyCoachStudentVideoUploaded,
} from "@/lib/push/send-push";
import {
  buildCoachNewSessionBookingWhatsApp,
  buildCoachStudentRegisteredWhatsApp,
  buildCoachVideoCorrectionRequestWhatsApp,
  buildCoachVideoUploadedWhatsApp,
  sendCoachWhatsAppMessage,
} from "@/lib/whatsapp/coach-notify";

async function runCoachNotifications(
  label: string,
  tasks: Array<() => Promise<void>>,
): Promise<void> {
  const results = await Promise.allSettled(tasks.map((t) => t()));
  for (const r of results) {
    if (r.status === "rejected") {
      console.error(`[notify-coach] ${label}:`, r.reason);
    }
  }
}

/** Registro de alumno: push + email + WhatsApp */
export async function coachNotifyStudentRegistered(details: {
  studentName: string;
  studentEmail: string;
  studentId: string;
}): Promise<void> {
  await runCoachNotifications("student-registered", [
    () =>
      notifyCoachNewStudentRegistered({
        studentName: details.studentName,
        studentEmail: details.studentEmail,
        studentId: details.studentId,
      }),
    () =>
      sendCoachNewStudentRegisteredEmail({
        studentName: details.studentName,
        studentEmail: details.studentEmail,
      }),
    () =>
      sendCoachWhatsAppMessage(
        buildCoachStudentRegisteredWhatsApp({
          studentName: details.studentName,
          studentEmail: details.studentEmail,
        }),
      ),
  ]);
}

/** Nueva reserva de clase en pista */
export async function coachNotifyNewSessionBooking(details: {
  studentName: string;
  studentEmail: string;
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
        studentName: details.studentName,
        slotLabel: details.slotLabel,
        dateLabel: when,
        bookingId: details.bookingId,
        kind: "session",
        startAt: details.startAt,
        endAt: details.endAt,
      }),
    () =>
      sendCoachNewSessionBookingEmail({
        studentName: details.studentName,
        studentEmail: details.studentEmail,
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
          studentName: details.studentName,
          studentEmail: details.studentEmail,
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

/** Nueva solicitud de video corrección (reserva) */
export async function coachNotifyVideoCorrectionBooking(details: {
  studentName: string;
  studentEmail: string;
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
        studentName: details.studentName,
        slotLabel: label,
        dateLabel: "Video corrección",
        bookingId: details.bookingId,
        kind: "video_correction",
        videoCount: details.videoCount,
      }),
    () =>
      sendCoachVideoCorrectionRequestEmail({
        studentName: details.studentName,
        studentEmail: details.studentEmail,
        videoCount: details.videoCount,
        totalEuros: details.totalEuros,
        notes: details.notes,
        panelUrl,
      }),
    () =>
      sendCoachWhatsAppMessage(
        buildCoachVideoCorrectionRequestWhatsApp({
          studentName: details.studentName,
          studentEmail: details.studentEmail,
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
  studentName: string;
  studentEmail: string;
  videoTitle: string;
  studentId: string;
}): Promise<void> {
  const panelUrl = `${getAppBaseUrl()}/coach/alumnos/${details.studentId}`;

  await runCoachNotifications("video-uploaded", [
    () =>
      notifyCoachStudentVideoUploaded({
        studentName: details.studentName,
        videoTitle: details.videoTitle,
        studentId: details.studentId,
      }),
    () =>
      sendCoachVideoUploadedEmail({
        studentName: details.studentName,
        studentEmail: details.studentEmail,
        videoTitle: details.videoTitle,
        panelUrl,
      }),
    () =>
      sendCoachWhatsAppMessage(
        buildCoachVideoUploadedWhatsApp({
          studentName: details.studentName,
          videoTitle: details.videoTitle,
          studentId: details.studentId,
        }),
      ),
  ]);
}
