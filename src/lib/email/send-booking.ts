import nodemailer from "nodemailer";
import {
  formatBookingInTimeZone,
  formatBookingWhen,
} from "@/lib/booking/format-datetime";
import {
  BOOKING_LOCATION,
  bookingPracticalInfoHtml,
} from "@/constants/booking-info";
import { coachWhatsAppHtmlForEmail } from "@/constants/coach-contact";
import { COACH_EMAIL, getAppBaseUrl } from "@/constants/project";
import type { BookingPaymentOption } from "@/constants/booking-payment";
import {
  BOOKING_BALANCE_ON_CLASS_DAY,
  BOOKING_BALANCE_PAYMENT_LABEL,
  BOOKING_DEPOSIT_PERCENT,
} from "@/constants/booking-payment";
import type { SessionDuration } from "@/constants/session-schedules";
import { logCoachEmailSkipped } from "@/lib/email/send-coach-alerts";

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

export interface BookingEmailSessionLine {
  slotLabel: string;
  startAt: Date;
  endAt: Date;
}

export interface BookingEmailDetails {
  alumnoName: string;
  alumnoEmail: string;
  session: SessionDuration;
  slotLabel: string;
  startAt: Date;
  endAt: Date;
  lessonTypeName: string;
  notes?: string;
  participantCount?: number;
  totalEuros: number;
  /** Varias clases en una solicitud */
  sessions?: BookingEmailSessionLine[];
  daysPlanLabel?: string;
  /** Si el alumno ya pagó con Stripe */
  paidWithCard?: boolean;
  /** Enlace a /pagar/{id} tras confirmación del coach */
  paymentUrl?: string;
  /** Reserva vinculada a cuenta Firebase (alumno registrado) */
  isRegisteredAlumno?: boolean;
  paymentOption?: BookingPaymentOption;
  /** Importe cobrado ya con tarjeta (señal o total) */
  chargeEuros?: number;
  /** Resto en efectivo o Bizum en pista */
  balanceEuros?: number;
  /** Tras rechazo del coach con devolución Stripe */
  paymentRefunded?: boolean;
}

/** Alumno: solicitud recibida; coach opcional (solo si no hay pago online pendiente). */
export async function sendBookingRequestEmails(
  details: BookingEmailDetails & { notifyCoach?: boolean },
): Promise<void> {
  const notifyCoach = details.notifyCoach !== false;
  if (!isEmailConfigured()) {
    console.warn("[email] SMTP no configurado; omitiendo envío");
    return;
  }

  const transport = getTransport();
  const from = fromAddress();
  const total = details.totalEuros;
  const coachPanelUrl = `${getAppBaseUrl()}/coach`;
  const peopleLine =
    details.participantCount && details.participantCount > 1
      ? `<li>Personas en pista: <strong>${details.participantCount}</strong></li>`
      : "";
  const multi = details.sessions && details.sessions.length > 1;
  const when = multi
    ? details.sessions!
        .map(
          (s) =>
            `<li>${formatBookingWhen(s.startAt, s.endAt)} · ${s.slotLabel}</li>`,
        )
        .join("")
    : `<li>${formatBookingWhen(details.startAt, details.endAt)} · ${details.slotLabel}</li>`;
  const planLine = details.daysPlanLabel
    ? `<li>Plan: <strong>${details.daysPlanLabel}</strong></li>`
    : "";
  const classCountLine = multi
    ? `<li><strong>${details.session.name}</strong> · ${details.sessions!.length} clases</li>`
    : `<li><strong>${details.session.name}</strong> (${details.slotLabel})</li>`;

  const alumnoHtml = `
    <h2>Solicitud de reserva recibida — AM Snowboard Coach</h2>
    <p>Hola ${details.alumnoName},</p>
    <p>Hemos recibido tu solicitud en Sierra Nevada:</p>
    <ul>
      ${classCountLine}
      ${planLine}
      ${when}
      <li>Estilo: ${details.lessonTypeName}</li>
      ${peopleLine}
      <li>Importe previsto: <strong>${total} €</strong>${multi ? " (todas las clases)" : ""}</li>
    </ul>
    ${details.notes ? `<p>Notas: ${details.notes}</p>` : ""}
    ${bookingPracticalInfoHtml()}
    ${details.isRegisteredAlumno ? coachWhatsAppHtmlForEmail() : ""}
    ${
      details.paymentOption === "deposit_30" && details.chargeEuros != null
        ? `<p><strong>Señal del ${BOOKING_DEPOSIT_PERCENT}% (${details.chargeEuros} €)</strong> pendiente de completar con tarjeta en la web. Tras el pago, <strong>Alejandro aceptará tu plaza</strong> y te avisará por email. Resto previsto: <strong>${details.balanceEuros ?? 0} €</strong> en ${BOOKING_BALANCE_ON_CLASS_DAY}.</p>`
        : details.paymentOption === "full_stripe"
          ? `<p><strong>Pago total (${total} €)</strong> pendiente de completar con tarjeta en la web. Tras el pago, <strong>Alejandro aceptará tu plaza</strong> y te avisará por email.</p>`
          : "<p><strong>Alejandro aceptará tu plaza</strong> y te indicará cómo completar el pago.</p>"
    }
    <p>— AM Snowboard Coach</p>
  `;

  const coachHtml = `
    <h2>Nueva solicitud de reserva${multi ? ` (${details.sessions!.length} días)` : ""}</h2>
    <p>Acepta o rechaza desde el panel del coach. Para reservas web con pago online, acepta cuando el alumno haya pagado la señal o el total; entonces se bloquea el calendario:</p>
    <p><a href="${coachPanelUrl}">${coachPanelUrl}</a></p>
    <ul>
      <li>Alumno: ${details.alumnoName} &lt;${details.alumnoEmail}&gt;</li>
      ${classCountLine}
      ${planLine}
      ${when}
      <li>${details.lessonTypeName}</li>
      ${peopleLine}
      <li>Total solicitud: ${total} €</li>
      ${
        details.paymentOption === "deposit_30" && details.chargeEuros != null
          ? `<li>Pago elegido: señal ${BOOKING_DEPOSIT_PERCENT}% (${details.chargeEuros} € tarjeta) + ${details.balanceEuros ?? 0} € en ${BOOKING_BALANCE_PAYMENT_LABEL}</li>`
          : details.paymentOption === "full_stripe"
            ? `<li>Pago elegido: 100% con tarjeta (${details.chargeEuros ?? total} €)</li>`
            : ""
      }
    </ul>
    ${details.notes ? `<p>Notas: ${details.notes}</p>` : ""}
  `;

  const subjectDate = formatBookingInTimeZone(details.startAt, "d/M/yyyy");
  const subjectSuffix = multi
    ? `${details.sessions!.length} días desde ${subjectDate}`
    : `${details.slotLabel} · ${subjectDate}`;

  await transport.sendMail({
    from: `"AM Snowboard Coach" <${from}>`,
    to: details.alumnoEmail,
    replyTo: COACH_EMAIL,
    subject: `Solicitud recibida — ${subjectSuffix}`,
    html: alumnoHtml,
  });

  if (notifyCoach) {
    await transport.sendMail({
      from: `"AM Snowboard Coach" <${from}>`,
      to: process.env.BOOKING_NOTIFY_EMAIL?.trim() || COACH_EMAIL,
      subject: `Confirmar reserva: ${details.alumnoName} — ${subjectSuffix}`,
      html: coachHtml,
    });
  }
}

/** Coach: alumno pagó señal o total; puede aceptar o rechazar en el panel */
export async function sendCoachBookingPaidAwaitingApprovalEmail(
  details: BookingEmailDetails & { chargeEuros: number },
): Promise<boolean> {
  if (!isEmailConfigured()) {
    return logCoachEmailSkipped("session-booking-paid");
  }

  const transport = getTransport();
  const from = fromAddress();
  const coachPanelUrl = `${getAppBaseUrl()}/coach?tab=reservas`;
  const multi = details.sessions && details.sessions.length > 1;
  const when = multi
    ? details.sessions!
        .map(
          (s) =>
            `<li>${formatBookingWhen(s.startAt, s.endAt)} · ${s.slotLabel}</li>`,
        )
        .join("")
    : `<li>${formatBookingWhen(details.startAt, details.endAt)} · ${details.slotLabel}</li>`;
  const planLine = details.daysPlanLabel
    ? `<li>Plan: <strong>${details.daysPlanLabel}</strong></li>`
    : "";
  const peopleLine =
    details.participantCount && details.participantCount > 1
      ? `<li>Personas en pista: <strong>${details.participantCount}</strong></li>`
      : "";
  const paidLine =
    details.paymentOption === "deposit_30"
      ? `<li>Pago recibido: señal ${BOOKING_DEPOSIT_PERCENT}% — <strong>${details.chargeEuros} €</strong> (tarjeta). Resto previsto: <strong>${details.balanceEuros ?? 0} €</strong> en ${BOOKING_BALANCE_PAYMENT_LABEL}.</li>`
      : `<li>Pago recibido: <strong>${details.chargeEuros} €</strong> (total con tarjeta).</li>`;

  const html = `
    <h2>Pago recibido — acepta o rechaza la reserva${multi ? ` (${details.sessions!.length} días)` : ""}</h2>
    <p>El alumno ha completado el pago con tarjeta. Revisa la solicitud en el panel del coach:</p>
    <p><a href="${coachPanelUrl}">${coachPanelUrl}</a></p>
    <ul>
      <li>Alumno: ${details.alumnoName} &lt;${details.alumnoEmail}&gt;</li>
      <li><strong>${details.session.name}</strong>${multi ? ` · ${details.sessions!.length} clases` : ` (${details.slotLabel})`}</li>
      ${planLine}
      ${when}
      <li>Estilo: ${details.lessonTypeName}</li>
      ${peopleLine}
      <li>Importe clase(s): <strong>${details.totalEuros} €</strong></li>
      ${paidLine}
    </ul>
    ${details.notes ? `<p>Notas: ${details.notes}</p>` : ""}
    <p>Al aceptar se bloqueará el turno en Google Calendar y se avisará al alumno.</p>
  `;

  const subjectDate = formatBookingInTimeZone(details.startAt, "d/M/yyyy");
  const subjectSuffix = multi
    ? `${details.sessions!.length} días desde ${subjectDate}`
    : `${details.slotLabel} · ${subjectDate}`;

  await transport.sendMail({
    from: `"AM Snowboard Coach" <${from}>`,
    to: process.env.BOOKING_NOTIFY_EMAIL?.trim() || COACH_EMAIL,
    subject: `Pago recibido — confirmar: ${details.alumnoName} — ${subjectSuffix}`,
    html,
  });
  return true;
}

/** Tras confirmar por el coach */
export async function sendBookingConfirmedEmails(
  details: BookingEmailDetails,
): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[email] SMTP no configurado; omitiendo envío");
    return;
  }

  const transport = getTransport();
  const from = fromAddress();
  const when = formatBookingWhen(details.startAt, details.endAt);
  const total = details.totalEuros;
  const peopleLine =
    details.participantCount && details.participantCount > 1
      ? `<li>Personas en pista: <strong>${details.participantCount}</strong></li>`
      : "";

  const alumnoHtml = `
    <h2>Reserva confirmada — AM Snowboard Coach</h2>
    <p>Hola ${details.alumnoName},</p>
    <p>Alejandro ha confirmado tu clase en Sierra Nevada:</p>
    <ul>
      <li><strong>${details.session.name}</strong> (${details.slotLabel})</li>
      <li>${when}</li>
      <li>Estilo: ${details.lessonTypeName}</li>
      ${peopleLine}
      <li>Lugar: ${BOOKING_LOCATION}</li>
      <li>Importe: <strong>${total} €</strong></li>
    </ul>
    ${details.notes ? `<p>Notas: ${details.notes}</p>` : ""}
    ${bookingPracticalInfoHtml()}
    ${details.isRegisteredAlumno ? coachWhatsAppHtmlForEmail() : ""}
    ${
      details.paymentOption === "deposit_30" && details.paidWithCard
        ? `<p><strong>Señal del ${BOOKING_DEPOSIT_PERCENT}% ya pagada</strong> con tarjeta. Resto en pista: <strong>${details.balanceEuros ?? 0} €</strong> en ${BOOKING_BALANCE_PAYMENT_LABEL}.</p>`
        : details.paidWithCard
          ? "<p><strong>Pago completo recibido</strong> con tarjeta. ¡Gracias!</p>"
          : details.paymentUrl
            ? `<p><strong>Siguiente paso:</strong> paga con tarjeta:</p>
             <p style="margin:24px 0"><a href="${details.paymentUrl}" style="display:inline-block;background:#6eb0c8;color:#1a2332;padding:14px 28px;border-radius:9999px;font-weight:600;text-decoration:none">Pagar ${total} € con tarjeta</a></p>`
            : `<p>Importe total: <strong>${total} €</strong> — coordina el pago con Alejandro.</p>`
    }
    <p>Recibirás también la invitación en Google Calendar si está activada en tu email.</p>
    <p>¡Nos vemos en pista!<br/>Alejandro — AM Snowboard Coach</p>
  `;

  const coachHtml = `
    <h2>Reserva confirmada</h2>
    <ul>
      <li>Alumno: ${details.alumnoName} &lt;${details.alumnoEmail}&gt;</li>
      <li>${details.session.name} · ${details.slotLabel}</li>
      <li>${when}</li>
      ${peopleLine}
      <li>Lugar: ${BOOKING_LOCATION}</li>
      <li>${total} €</li>
    </ul>
    ${bookingPracticalInfoHtml()}
    <p>Evento creado en Google Calendar.</p>
  `;

  await transport.sendMail({
    from: `"AM Snowboard Coach" <${from}>`,
    to: details.alumnoEmail,
    replyTo: COACH_EMAIL,
    subject: `Clase confirmada — ${details.slotLabel} · ${formatBookingInTimeZone(details.startAt, "d/M/yyyy")}`,
    html: alumnoHtml,
  });

  await transport.sendMail({
    from: `"AM Snowboard Coach" <${from}>`,
    to: process.env.BOOKING_NOTIFY_EMAIL?.trim() || COACH_EMAIL,
    subject: `Confirmada: ${details.alumnoName} — ${details.slotLabel}`,
    html: coachHtml,
  });
}

export interface VideoCorrectionEmailDetails {
  alumnoName: string;
  alumnoEmail: string;
  videoCount: number;
  totalEuros: number;
  notes?: string;
  paidWithCard?: boolean;
  paymentUrl?: string;
}

/** Solicitud de video corrección recibida */
export async function sendVideoCorrectionRequestEmails(
  details: VideoCorrectionEmailDetails,
): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[email] SMTP no configurado; omitiendo envío");
    return;
  }

  const transport = getTransport();
  const from = fromAddress();
  const label = `${details.videoCount} vídeo${details.videoCount > 1 ? "s" : ""}`;

  const alumnoHtml = `
    <h2>Solicitud de video corrección — AM Snowboard Coach</h2>
    <p>Hola ${details.alumnoName},</p>
    <p>Hemos recibido tu solicitud:</p>
    <ul>
      <li><strong>Video corrección</strong> — ${label}</li>
      <li>Precio: <strong>${details.totalEuros} €</strong> (${details.videoCount} × 20 €/vídeo)</li>
    </ul>
    ${details.notes ? `<p>Notas: ${details.notes}</p>` : ""}
    <p><strong>Completa el pago con tarjeta</strong> en la web (te llevamos a Stripe). Tras el pago, <strong>Alejandro aceptará tu solicitud</strong> y te avisará para subir el material en <a href="${getAppBaseUrl()}/perfil/videos">Mis vídeos</a>.</p>
  `;

  await transport.sendMail({
    from: `"AM Snowboard Coach" <${from}>`,
    to: details.alumnoEmail,
    replyTo: COACH_EMAIL,
    subject: `Solicitud video corrección — ${label}`,
    html: alumnoHtml,
  });
}

/** Tras confirmar video corrección */
export async function sendVideoCorrectionConfirmedEmails(
  details: VideoCorrectionEmailDetails,
): Promise<void> {
  if (!isEmailConfigured()) return;

  const transport = getTransport();
  const from = fromAddress();
  const label = `${details.videoCount} vídeo${details.videoCount > 1 ? "s" : ""}`;
  const total = details.totalEuros;

  const alumnoHtml = `
    <h2>Video corrección confirmada</h2>
    <p>Hola ${details.alumnoName},</p>
    <p>Alejandro ha aceptado corregir <strong>${label}</strong> (total ${total} €).</p>
    ${details.notes ? `<p>Tus notas: ${details.notes}</p>` : ""}
    ${
      details.paidWithCard
        ? `<p><strong>Pago recibido.</strong> Sube ${label} desde tu área de alumno:</p>
           <p style="margin:24px 0"><a href="${getAppBaseUrl()}/perfil/videos" style="display:inline-block;background:#6eb0c8;color:#1a2332;padding:14px 28px;border-radius:9999px;font-weight:600;text-decoration:none">Subir vídeos</a></p>`
        : details.paymentUrl
          ? `<p><strong>Paga con tarjeta</strong> para activar la corrección:</p>
             <p style="margin:24px 0"><a href="${details.paymentUrl}" style="display:inline-block;background:#6eb0c8;color:#1a2332;padding:14px 28px;border-radius:9999px;font-weight:600;text-decoration:none">Pagar ${total} €</a></p>
             <p>Tras pagar, sube el material en <a href="${getAppBaseUrl()}/perfil/videos">Mis vídeos</a>.</p>`
          : `<p>Coordina el pago de ${total} € con Alejandro. Luego sube el material en <a href="${getAppBaseUrl()}/perfil/videos">Mis vídeos</a>.</p>`
    }
  `;

  await transport.sendMail({
    from: `"AM Snowboard Coach" <${from}>`,
    to: details.alumnoEmail,
    replyTo: COACH_EMAIL,
    subject: `Video corrección confirmada — ${label}`,
    html: alumnoHtml,
  });
}

/** Tras pagar video corrección (Stripe), antes de que el coach acepte */
export async function sendVideoCorrectionPaymentReceivedEmail(
  details: VideoCorrectionEmailDetails,
): Promise<void> {
  if (!isEmailConfigured()) return;

  const transport = getTransport();
  const from = fromAddress();
  const label = `${details.videoCount} vídeo${details.videoCount > 1 ? "s" : ""}`;

  await transport.sendMail({
    from: `"AM Snowboard Coach" <${from}>`,
    to: details.alumnoEmail,
    replyTo: COACH_EMAIL,
    subject: `Pago recibido — ${label}`,
    html: `
      <h2>Pago confirmado</h2>
      <p>Hola ${details.alumnoName},</p>
      <p>Hemos recibido <strong>${details.totalEuros} €</strong> por la corrección de <strong>${label}</strong>.</p>
      <p><strong>Alejandro revisará tu solicitud</strong> y te avisará por email y notificación cuando puedas subir el material en <a href="${getAppBaseUrl()}/perfil/videos">Mis vídeos</a>.</p>
    `,
  });
}

/** Coach: alumno pagó video corrección — puede aceptar o rechazar */
export async function sendCoachVideoBookingPaidAwaitingApprovalEmail(
  details: VideoCorrectionEmailDetails,
): Promise<boolean> {
  if (!isEmailConfigured()) return logCoachEmailSkipped("video-booking-paid");

  const transport = getTransport();
  const from = fromAddress();
  const coachPanelUrl = `${getAppBaseUrl()}/coach?tab=reservas`;
  const label = `${details.videoCount} vídeo${details.videoCount > 1 ? "s" : ""}`;

  await transport.sendMail({
    from: `"AM Snowboard Coach" <${from}>`,
    to: process.env.BOOKING_NOTIFY_EMAIL?.trim() || COACH_EMAIL,
    subject: `Pago recibido — video corrección: ${details.alumnoName} — ${label}`,
    html: `
      <h2>Pago recibido — acepta o rechaza la solicitud</h2>
      <p>El alumno ha pagado con tarjeta. Revisa en el panel del coach:</p>
      <p><a href="${coachPanelUrl}">${coachPanelUrl}</a></p>
      <ul>
        <li>Alumno: ${details.alumnoName} &lt;${details.alumnoEmail}&gt;</li>
        <li><strong>Video corrección</strong> — ${label}</li>
        <li>Pago recibido: <strong>${details.totalEuros} €</strong> (tarjeta)</li>
      </ul>
      ${details.notes ? `<p>Notas: ${details.notes}</p>` : ""}
      <p>Al aceptar, el alumno podrá subir el material desde su área de vídeos.</p>
    `,
  });
  return true;
}

export async function sendVideoCorrectionRejectedEmail(
  details: VideoCorrectionEmailDetails,
): Promise<void> {
  if (!isEmailConfigured()) return;

  const transport = getTransport();
  const from = fromAddress();
  const label = `${details.videoCount} vídeo${details.videoCount > 1 ? "s" : ""}`;

  await transport.sendMail({
    from: `"AM Snowboard Coach" <${from}>`,
    to: details.alumnoEmail,
    replyTo: COACH_EMAIL,
    subject: `Solicitud no confirmada — video corrección`,
    html: `
      <p>Hola ${details.alumnoName},</p>
      <p>No hemos podido aceptar tu solicitud de corrección (${label}).</p>
      <p>Puedes intentarlo de nuevo en <a href="${getAppBaseUrl()}/reservar?tipo=video">reservar video corrección</a>.</p>
    `,
  });
}

export async function sendBookingRejectedEmail(
  details: BookingEmailDetails,
): Promise<void> {
  if (!isEmailConfigured()) return;

  const transport = getTransport();
  const from = fromAddress();
  const when = formatBookingWhen(details.startAt, details.endAt);

  const alumnoHtml = `
    <h2>Solicitud no disponible — AM Snowboard Coach</h2>
    <p>Hola ${details.alumnoName},</p>
    <p>Lo sentimos: no hemos podido confirmar la clase solicitada:</p>
    <ul>
      <li>${details.session.name} (${details.slotLabel})</li>
      <li>${when}</li>
    </ul>
    ${
      details.paymentRefunded
        ? "<p>Si pagaste con tarjeta, el importe se devuelve automáticamente al mismo método (suele verse en 5–10 días laborables según tu banco).</p>"
        : ""
    }
    <p>Puedes elegir otra fecha en <a href="${getAppBaseUrl()}/reservar">reservar</a> o escribir a ${COACH_EMAIL}.</p>
    <p>— Alejandro, AM Snowboard Coach</p>
  `;

  await transport.sendMail({
    from: `"AM Snowboard Coach" <${from}>`,
    to: details.alumnoEmail,
    replyTo: COACH_EMAIL,
    subject: `Solicitud no confirmada — ${formatBookingInTimeZone(details.startAt, "d/M/yyyy")}`,
    html: alumnoHtml,
  });
}
