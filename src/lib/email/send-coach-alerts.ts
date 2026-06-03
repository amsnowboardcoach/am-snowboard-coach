import nodemailer from "nodemailer";
import { COACH_EMAIL, getAppBaseUrl } from "@/constants/project";

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim(),
  );
}

function getTransport() {
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!user || !pass) {
    throw new Error("SMTP_USER y SMTP_PASS no configurados");
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user, pass },
  });
}

function fromAddress(): string {
  return (
    process.env.BOOKING_FROM_EMAIL?.trim() ||
    process.env.SMTP_USER?.trim() ||
    COACH_EMAIL
  );
}

function coachNotifyTo(): string {
  return process.env.BOOKING_NOTIFY_EMAIL?.trim() || COACH_EMAIL;
}

/** Email al coach cuando un alumno crea cuenta */
export async function sendCoachNewAlumnoRegisteredEmail(details: {
  alumnoName: string;
  alumnoEmail: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;

  const base = getAppBaseUrl();
  const panelUrl = `${base}/coach?tab=alumnos`;

  await getTransport().sendMail({
    from: fromAddress(),
    to: coachNotifyTo(),
    subject: `Nuevo alumno: ${details.alumnoName}`,
    html: `
      <p>Se ha registrado un alumno en <strong>AM Snowboard Coach</strong>.</p>
      <ul>
        <li><strong>Nombre:</strong> ${details.alumnoName}</li>
        <li><strong>Email:</strong> ${details.alumnoEmail}</li>
      </ul>
      <p><a href="${panelUrl}">Ver alumnos en el panel</a></p>
    `,
    text: `Nuevo alumno: ${details.alumnoName} (${details.alumnoEmail}). Panel: ${panelUrl}`,
  });
}

/** Email al coach cuando un alumno elimina su cuenta o el coach la borra */
export async function sendCoachAlumnoDeletedEmail(details: {
  alumnoName: string;
  alumnoEmail: string;
  source: "self" | "coach";
  coachName?: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;

  const base = getAppBaseUrl();
  const panelUrl = `${base}/coach?tab=alumnos`;
  const reason =
    details.source === "self"
      ? "El alumno ha dado de baja su cuenta desde el área privada."
      : details.coachName
        ? `Eliminado por ${details.coachName} desde el panel coach.`
        : "Eliminado desde el panel coach.";

  await getTransport().sendMail({
    from: fromAddress(),
    to: coachNotifyTo(),
    subject: `Alumno eliminado: ${details.alumnoName}`,
    html: `
      <p>Se ha eliminado una cuenta de alumno en <strong>AM Snowboard Coach</strong>.</p>
      <ul>
        <li><strong>Nombre:</strong> ${details.alumnoName}</li>
        <li><strong>Email:</strong> ${details.alumnoEmail}</li>
        <li><strong>Motivo:</strong> ${reason}</li>
      </ul>
      <p>Se han borrado perfil, reservas, vídeos, Tribu y mercadillo asociados.</p>
      <p><a href="${panelUrl}">Abrir panel de alumnos</a></p>
    `,
    text: `Alumno eliminado: ${details.alumnoName} (${details.alumnoEmail}). ${reason} Panel: ${panelUrl}`,
  });
}

/** Email al coach: nueva solicitud de clase en pista */
export async function sendCoachNewSessionBookingEmail(details: {
  alumnoName: string;
  alumnoEmail: string;
  lessonTypeName: string;
  sessionLabel: string;
  when: string;
  totalEuros: number;
  paymentPending?: boolean;
  bookingNotes?: string;
  participantCount?: number;
  panelUrl: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;

  const people =
    details.participantCount && details.participantCount > 1
      ? `<li>Personas en pista: <strong>${details.participantCount}</strong></li>`
      : "";
  const paymentLine = details.paymentPending
    ? "<li><strong>Pago con tarjeta pendiente</strong> en la web. Acepta en el panel cuando conste el pago.</li>"
    : "<li>Revisa y acepta o rechaza en el panel.</li>";

  await getTransport().sendMail({
    from: fromAddress(),
    to: coachNotifyTo(),
    subject: `Nueva reserva: ${details.alumnoName} — ${details.when}`,
    html: `
      <p>Nueva solicitud de clase en <strong>AM Snowboard Coach</strong>.</p>
      <ul>
        <li><strong>Alumno:</strong> ${details.alumnoName} &lt;${details.alumnoEmail}&gt;</li>
        <li><strong>Estilo:</strong> ${details.lessonTypeName}</li>
        <li><strong>Modalidad:</strong> ${details.sessionLabel}</li>
        <li><strong>Cuándo:</strong> ${details.when}</li>
        ${people}
        <li><strong>Importe:</strong> ${details.totalEuros} €</li>
        ${paymentLine}
      </ul>
      ${details.bookingNotes ? `<p>Notas: ${details.bookingNotes}</p>` : ""}
      <p><a href="${details.panelUrl}">Abrir panel de reservas</a></p>
    `,
    text: `Nueva reserva de ${details.alumnoName}. ${details.when}. Panel: ${details.panelUrl}`,
  });
}

/** Email al coach: solicitud de video corrección (sin duplicar mail al alumno) */
export async function sendCoachVideoCorrectionRequestEmail(details: {
  alumnoName: string;
  alumnoEmail: string;
  videoCount: number;
  totalEuros: number;
  notes?: string;
  panelUrl: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;

  const label = `${details.videoCount} vídeo${details.videoCount > 1 ? "s" : ""}`;

  await getTransport().sendMail({
    from: fromAddress(),
    to: coachNotifyTo(),
    subject: `Video corrección: ${details.alumnoName} — ${label}`,
    html: `
      <p>Nueva solicitud de <strong>video corrección</strong>.</p>
      <ul>
        <li><strong>Alumno:</strong> ${details.alumnoName} &lt;${details.alumnoEmail}&gt;</li>
        <li><strong>Paquete:</strong> ${label} · ${details.totalEuros} €</li>
      </ul>
      ${details.notes ? `<p>Notas: ${details.notes}</p>` : ""}
      <p><a href="${details.panelUrl}">Abrir panel de reservas</a></p>
    `,
    text: `Video corrección: ${details.alumnoName}, ${label}. Panel: ${details.panelUrl}`,
  });
}

/** Email al coach: alumno subió vídeo para revisar */
export async function sendCoachVideoUploadedEmail(details: {
  alumnoName: string;
  alumnoEmail: string;
  videoTitle: string;
  panelUrl: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;

  await getTransport().sendMail({
    from: fromAddress(),
    to: coachNotifyTo(),
    subject: `Vídeo nuevo: ${details.alumnoName}`,
    html: `
      <p>Un alumno ha subido un vídeo pendiente de revisión.</p>
      <ul>
        <li><strong>Alumno:</strong> ${details.alumnoName} &lt;${details.alumnoEmail}&gt;</li>
        <li><strong>Título:</strong> ${details.videoTitle}</li>
      </ul>
      <p><a href="${details.panelUrl}">Revisar en el panel</a></p>
    `,
    text: `Vídeo de ${details.alumnoName}: ${details.videoTitle}. ${details.panelUrl}`,
  });
}
