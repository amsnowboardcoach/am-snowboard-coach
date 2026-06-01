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
export async function sendCoachNewStudentRegisteredEmail(details: {
  studentName: string;
  studentEmail: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;

  const base = getAppBaseUrl();
  const panelUrl = `${base}/coach?tab=alumnos`;

  await getTransport().sendMail({
    from: fromAddress(),
    to: coachNotifyTo(),
    subject: `Nuevo alumno: ${details.studentName}`,
    html: `
      <p>Se ha registrado un alumno en <strong>AM Snowboard Coach</strong>.</p>
      <ul>
        <li><strong>Nombre:</strong> ${details.studentName}</li>
        <li><strong>Email:</strong> ${details.studentEmail}</li>
      </ul>
      <p><a href="${panelUrl}">Ver alumnos en el panel</a></p>
    `,
    text: `Nuevo alumno: ${details.studentName} (${details.studentEmail}). Panel: ${panelUrl}`,
  });
}
