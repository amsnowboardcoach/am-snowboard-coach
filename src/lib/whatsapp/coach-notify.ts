import {
  BOOKING_BALANCE_ON_SLOPE,
  BOOKING_DEPOSIT_PERCENT,
  type BookingPaymentOption,
} from "@/constants/booking-payment";
import { getAppBaseUrl } from "@/constants/project";
import { formatBookingWhen } from "@/lib/booking/format-datetime";

export interface CoachBookingWhatsAppDetails {
  bookingId: string;
  studentName: string;
  studentEmail: string;
  lessonTypeName: string;
  sessionLabel: string;
  startAt: Date;
  endAt: Date;
  participantCount?: number;
  chargeEuros: number;
  totalEuros?: number;
  balanceEuros?: number;
  paymentOption?: BookingPaymentOption;
  bookingNotes?: string;
  /** Varias clases en un solo pago */
  sessions?: { slotLabel: string; startAt: Date; endAt: Date }[];
}

function coachNotifyPhoneDigits(): string {
  const raw =
    process.env.COACH_WHATSAPP_NOTIFY_PHONE?.trim() ||
    process.env.NEXT_PUBLIC_COACH_WHATSAPP?.trim() ||
    "34617354031";
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 9) return digits;
  return "34617354031";
}

export function isCoachWhatsAppNotifyConfigured(): boolean {
  return Boolean(process.env.CALLMEBOT_API_KEY?.trim());
}

export function buildCoachBookingPaidWhatsAppMessage(
  details: CoachBookingWhatsAppDetails,
): string {
  const panelUrl = `${getAppBaseUrl()}/coach?tab=reservas`;
  const people =
    details.participantCount && details.participantCount > 1
      ? `${details.participantCount} personas en pista`
      : "1 persona en pista";

  let paymentLine: string;
  if (details.paymentOption === "deposit_30") {
    paymentLine = `Pago tarjeta: ${details.chargeEuros} € (señal ${BOOKING_DEPOSIT_PERCENT}%)`;
    if (details.balanceEuros != null && details.balanceEuros > 0) {
      paymentLine += ` · Resto ${details.balanceEuros} € en ${BOOKING_BALANCE_ON_SLOPE}`;
    }
  } else {
    paymentLine = `Pago tarjeta: ${details.chargeEuros} € (total)`;
  }

  const totalLine =
    details.totalEuros != null && details.totalEuros !== details.chargeEuros
      ? `Importe clase(s): ${details.totalEuros} €`
      : null;

  const whenLines =
    details.sessions && details.sessions.length > 1
      ? details.sessions
          .map(
            (s, i) =>
              `  ${i + 1}. ${formatBookingWhen(s.startAt, s.endAt)} · ${s.slotLabel}`,
          )
          .join("\n")
      : `  ${formatBookingWhen(details.startAt, details.endAt)} · ${details.sessionLabel}`;

  const notesLine = details.bookingNotes?.trim()
    ? `Notas: ${details.bookingNotes.trim().slice(0, 200)}`
    : null;

  return [
    "Nueva reserva AM Snowboard Coach",
    "Pago recibido — acepta o rechaza en el panel",
    "",
    `Alumno: ${details.studentName}`,
    `Email: ${details.studentEmail}`,
    `Estilo: ${details.lessonTypeName}`,
    `Modalidad: ${details.sessionLabel}`,
    `Personas: ${people}`,
    "Fecha(s):",
    whenLines,
    paymentLine,
    totalLine,
    notesLine,
    "",
    `Panel: ${panelUrl}`,
    `Ref: ${details.bookingId.slice(0, 8)}`,
  ]
    .filter((line): line is string => line != null && line !== "")
    .join("\n");
}

async function sendViaCallMeBot(phone: string, body: string): Promise<void> {
  const apiKey = process.env.CALLMEBOT_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("CallMeBot no configurado");
  }

  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", body);
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString());
  const text = await res.text();
  if (!res.ok || /ERROR/i.test(text)) {
    throw new Error(`CallMeBot: ${text.slice(0, 200)}`);
  }
}

/** Envía WhatsApp al coach vía CallMeBot. */
export async function sendCoachWhatsAppMessage(message: string): Promise<void> {
  if (!isCoachWhatsAppNotifyConfigured()) {
    console.warn(
      "[whatsapp] Sin CALLMEBOT_API_KEY; omitiendo aviso al coach por WhatsApp",
    );
    return;
  }

  await sendViaCallMeBot(coachNotifyPhoneDigits(), message);
}

export async function sendCoachBookingPaidWhatsApp(
  details: CoachBookingWhatsAppDetails,
): Promise<void> {
  await sendCoachWhatsAppMessage(buildCoachBookingPaidWhatsAppMessage(details));
}

export function buildCoachStudentRegisteredWhatsApp(details: {
  studentName: string;
  studentEmail: string;
}): string {
  const panelUrl = `${getAppBaseUrl()}/coach?tab=alumnos`;
  return [
    "AM Snowboard Coach",
    "Nuevo alumno registrado",
    "",
    `Nombre: ${details.studentName}`,
    `Email: ${details.studentEmail}`,
    "",
    `Panel: ${panelUrl}`,
  ].join("\n");
}

export function buildCoachNewSessionBookingWhatsApp(details: {
  studentName: string;
  studentEmail: string;
  lessonTypeName: string;
  sessionLabel: string;
  startAt: Date;
  endAt: Date;
  totalEuros: number;
  paymentPending?: boolean;
  bookingId: string;
  bookingNotes?: string;
}): string {
  const panelUrl = `${getAppBaseUrl()}/coach?tab=reservas`;
  const when = formatBookingWhen(details.startAt, details.endAt);
  const lines = [
    "AM Snowboard Coach",
    details.paymentPending
      ? "Nueva solicitud de clase (pago pendiente)"
      : "Nueva solicitud de clase",
    "",
    `Alumno: ${details.studentName}`,
    `Email: ${details.studentEmail}`,
    `Estilo: ${details.lessonTypeName}`,
    `Modalidad: ${details.sessionLabel}`,
    `Cuándo: ${when}`,
    `Importe: ${details.totalEuros} €`,
  ];
  if (details.paymentPending) {
    lines.push("Estado: esperando pago con tarjeta en la web");
  }
  if (details.bookingNotes?.trim()) {
    lines.push(`Notas: ${details.bookingNotes.trim().slice(0, 180)}`);
  }
  lines.push("", `Panel: ${panelUrl}`, `Ref: ${details.bookingId.slice(0, 8)}`);
  return lines.join("\n");
}

export function buildCoachVideoCorrectionRequestWhatsApp(details: {
  studentName: string;
  studentEmail: string;
  videoCount: number;
  totalEuros: number;
  bookingId: string;
  notes?: string;
}): string {
  const panelUrl = `${getAppBaseUrl()}/coach?tab=reservas`;
  const label = `${details.videoCount} vídeo${details.videoCount > 1 ? "s" : ""}`;
  const lines = [
    "AM Snowboard Coach",
    "Nueva solicitud — video corrección",
    "",
    `Alumno: ${details.studentName}`,
    `Email: ${details.studentEmail}`,
    `${label} · ${details.totalEuros} €`,
  ];
  if (details.notes?.trim()) {
    lines.push(`Notas: ${details.notes.trim().slice(0, 180)}`);
  }
  lines.push("", `Panel: ${panelUrl}`, `Ref: ${details.bookingId.slice(0, 8)}`);
  return lines.join("\n");
}

export function buildCoachVideoUploadedWhatsApp(details: {
  studentName: string;
  videoTitle: string;
  studentId: string;
}): string {
  const panelUrl = `${getAppBaseUrl()}/coach/alumnos/${details.studentId}`;
  return [
    "AM Snowboard Coach",
    "Vídeo nuevo de un alumno",
    "",
    `Alumno: ${details.studentName}`,
    `Título: ${details.videoTitle}`,
    "Estado: pendiente de revisión",
    "",
    `Revisar: ${panelUrl}`,
  ].join("\n");
}
