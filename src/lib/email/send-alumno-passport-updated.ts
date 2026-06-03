import { coachWhatsAppHtmlForEmail } from "@/constants/coach-contact";
import { DEFAULT_ISSUER } from "@/constants/issuer";
import { COACH_EMAIL, getAppBaseUrl } from "@/constants/project";
import { isEmailConfigured } from "@/lib/email/send-booking";
import nodemailer from "nodemailer";

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
    DEFAULT_ISSUER.email ||
    COACH_EMAIL
  );
}

export async function sendAlumnoPassportUpdatedEmail(input: {
  alumnoName: string;
  alumnoEmail: string;
  title: string;
  body: string;
  passportUrl: string;
}): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn(
      "[email] SMTP no configurado; omitiendo aviso de pasaporte al alumno",
    );
    return;
  }

  const transport = getTransport();
  const from = fromAddress();
  const coachName = DEFAULT_ISSUER.legalName.split(" ")[0] || "Alejandro";
  const perfilUrl = `${getAppBaseUrl()}/perfil`;

  const html = `
    <h2>${input.title}</h2>
    <p>Hola ${input.alumnoName},</p>
    <p>${input.body}</p>
    <p style="margin:24px 0">
      <a href="${input.passportUrl}"
         style="display:inline-block;padding:12px 20px;background:#059669;color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
        Ver mi pasaporte de trucos
      </a>
    </p>
    <p style="font-size:14px;color:#a1a1aa">
      También puedes entrar en
      <a href="${perfilUrl}" style="color:#7bc49a">tu área de alumno</a>
      para vídeos, reservas y el resto de tu perfil.
    </p>
    <p style="margin-top:20px;font-size:14px;color:#a1a1aa">
      — ${coachName}, AM Snowboard Coach · Sierra Nevada
    </p>
    ${coachWhatsAppHtmlForEmail()}
  `;

  const text = `Hola ${input.alumnoName},

${input.body}

Ver pasaporte: ${input.passportUrl}
Área de alumno: ${perfilUrl}

— ${coachName}, AM Snowboard Coach`;

  await transport.sendMail({
    from,
    to: input.alumnoEmail,
    subject: input.title,
    html,
    text,
  });
}
