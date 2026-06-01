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
  studentName: string;
  studentEmail: string;
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
  isRegisteredStudent?: boolean;
  paymentOption?: BookingPaymentOption;
  /** Importe cobrado ya con tarjeta (señal o total) */
  chargeEuros?: number;
  /** Resto en efectivo o Bizum en pista */
  balanceEuros?: number;
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

  const studentHtml = `
    <h2>Solicitud de reserva recibida — AM Snowboard Coach</h2>
    <p>Hola ${details.studentName},</p>
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
    ${details.isRegisteredStudent ? coachWhatsAppHtmlForEmail() : ""}
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
      <li>Alumno: ${details.studentName} &lt;${details.studentEmail}&gt;</li>
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
    to: details.studentEmail,
    replyTo: COACH_EMAIL,
    subject: `Solicitud recibida — ${subjectSuffix}`,
    html: studentHtml,
  });

  if (notifyCoach) {
    await transport.sendMail({
      from: `"AM Snowboard Coach" <${from}>`,
      to: process.env.BOOKING_NOTIFY_EMAIL?.trim() || COACH_EMAIL,
      subject: `Confirmar reserva: ${details.studentName} — ${subjectSuffix}`,
      html: coachHtml,
    });
  }
}

/** Coach: alumno pagó señal o total; puede aceptar o rechazar en el panel */
export async function sendCoachBookingPaidAwaitingApprovalEmail(
  details: BookingEmailDetails & { chargeEuros: number },
): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn("[email] SMTP no configurado; omitiendo envío coach");
    return;
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
      <li>Alumno: ${details.studentName} &lt;${details.studentEmail}&gt;</li>
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
    subject: `Pago recibido — confirmar: ${details.studentName} — ${subjectSuffix}`,
    html,
  });
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

  const studentHtml = `
    <h2>Reserva confirmada — AM Snowboard Coach</h2>
    <p>Hola ${details.studentName},</p>
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
    ${details.isRegisteredStudent ? coachWhatsAppHtmlForEmail() : ""}
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
      <li>Alumno: ${details.studentName} &lt;${details.studentEmail}&gt;</li>
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
    to: details.studentEmail,
    replyTo: COACH_EMAIL,
    subject: `Clase confirmada — ${details.slotLabel} · ${formatBookingInTimeZone(details.startAt, "d/M/yyyy")}`,
    html: studentHtml,
  });

  await transport.sendMail({
    from: `"AM Snowboard Coach" <${from}>`,
    to: process.env.BOOKING_NOTIFY_EMAIL?.trim() || COACH_EMAIL,
    subject: `Confirmada: ${details.studentName} — ${details.slotLabel}`,
    html: coachHtml,
  });
}

export interface VideoCorrectionEmailDetails {
  studentName: string;
  studentEmail: string;
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
  const coachPanelUrl = `${getAppBaseUrl()}/coach`;
  const label = `${details.videoCount} vídeo${details.videoCount > 1 ? "s" : ""}`;

  const studentHtml = `
    <h2>Solicitud de video corrección — AM Snowboard Coach</h2>
    <p>Hola ${details.studentName},</p>
    <p>Hemos recibido tu solicitud:</p>
    <ul>
      <li><strong>Video corrección</strong> — ${label}</li>
      <li>Precio: <strong>${details.totalEuros} €</strong> (${details.videoCount} × 20 €/vídeo)</li>
    </ul>
    ${details.notes ? `<p>Notas: ${details.notes}</p>` : ""}
    <p>Cuando Alejandro confirme, recibirás el enlace de pago por email.</p>
  `;

  const coachHtml = `
    <h2>Nueva solicitud — video corrección</h2>
    <p><a href="${coachPanelUrl}">${coachPanelUrl}</a></p>
    <ul>
      <li>${details.studentName} &lt;${details.studentEmail}&gt;</li>
      <li>${label} · ${details.totalEuros} €</li>
    </ul>
    ${details.notes ? `<p>Notas: ${details.notes}</p>` : ""}
  `;

  await transport.sendMail({
    from: `"AM Snowboard Coach" <${from}>`,
    to: details.studentEmail,
    replyTo: COACH_EMAIL,
    subject: `Solicitud video corrección — ${label}`,
    html: studentHtml,
  });

  await transport.sendMail({
    from: `"AM Snowboard Coach" <${from}>`,
    to: process.env.BOOKING_NOTIFY_EMAIL?.trim() || COACH_EMAIL,
    subject: `Confirmar video: ${details.studentName} — ${label}`,
    html: coachHtml,
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

  const studentHtml = `
    <h2>Video corrección confirmada</h2>
    <p>Hola ${details.studentName},</p>
    <p>Alejandro ha aceptado corregir <strong>${label}</strong> (total ${total} €).</p>
    ${details.notes ? `<p>Tus notas: ${details.notes}</p>` : ""}
    ${
      details.paidWithCard
        ? "<p><strong>Pago recibido.</strong> En breve recibirás feedback sobre tu vídeo.</p>"
        : details.paymentUrl
          ? `<p><strong>Paga con tarjeta</strong> para activar la corrección:</p>
             <p style="margin:24px 0"><a href="${details.paymentUrl}" style="display:inline-block;background:#6eb0c8;color:#1a2332;padding:14px 28px;border-radius:9999px;font-weight:600;text-decoration:none">Pagar ${total} €</a></p>`
          : `<p>Coordina el pago de ${total} € con Alejandro.</p>`
    }
    <p>Envía o comparte el enlace del vídeo respondiendo a este email si aún no lo hiciste.</p>
  `;

  await transport.sendMail({
    from: `"AM Snowboard Coach" <${from}>`,
    to: details.studentEmail,
    replyTo: COACH_EMAIL,
    subject: `Video corrección confirmada — ${label}`,
    html: studentHtml,
  });
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
    to: details.studentEmail,
    replyTo: COACH_EMAIL,
    subject: `Solicitud no confirmada — video corrección`,
    html: `
      <p>Hola ${details.studentName},</p>
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

  const studentHtml = `
    <h2>Solicitud no disponible — AM Snowboard Coach</h2>
    <p>Hola ${details.studentName},</p>
    <p>Lo sentimos: no hemos podido confirmar la clase solicitada:</p>
    <ul>
      <li>${details.session.name} (${details.slotLabel})</li>
      <li>${when}</li>
    </ul>
    <p>Puedes elegir otra fecha en <a href="${getAppBaseUrl()}/reservar">reservar</a> o escribir a ${COACH_EMAIL}.</p>
    <p>— Alejandro, AM Snowboard Coach</p>
  `;

  await transport.sendMail({
    from: `"AM Snowboard Coach" <${from}>`,
    to: details.studentEmail,
    replyTo: COACH_EMAIL,
    subject: `Solicitud no confirmada — ${formatBookingInTimeZone(details.startAt, "d/M/yyyy")}`,
    html: studentHtml,
  });
}
