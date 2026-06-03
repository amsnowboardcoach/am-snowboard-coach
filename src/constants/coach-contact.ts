import { BOOKING_BALANCE_ON_CLASS_DAY } from "@/constants/booking-payment";
import { DEFAULT_ISSUER } from "@/constants/issuer";

/** Número E.164 sin + (España). Configurable en Vercel. */
function coachWhatsAppDigits(): string {
  const fromEnv = process.env.NEXT_PUBLIC_COACH_WHATSAPP?.replace(/\D/g, "");
  if (fromEnv && fromEnv.length >= 9) return fromEnv;
  const fromIssuer = DEFAULT_ISSUER.phone?.replace(/\D/g, "") ?? "";
  if (fromIssuer.startsWith("34")) return fromIssuer;
  if (fromIssuer.length === 9) return `34${fromIssuer}`;
  return "34617354031";
}

export const COACH_WHATSAPP_DISPLAY =
  process.env.NEXT_PUBLIC_COACH_WHATSAPP_DISPLAY?.trim() ||
  DEFAULT_ISSUER.phone ||
  "+34 617 354 031";

/** Horario de atención al público (consultas, reservas). */
export const COACH_PUBLIC_HOURS = "9:00 – 20:00";
export const COACH_PUBLIC_HOURS_NOTE =
  "Atención al público de 9:00 a 20:00, todos los días.";

/** Enlace tel: para llamar al coach. */
export function getCoachPhoneTelUrl(): string {
  return `tel:+${coachWhatsAppDigits()}`;
}

/** Enlace wa.me para abrir chat (opcional mensaje precargado). */
export function getCoachWhatsAppUrl(prefill?: string): string {
  const base = `https://wa.me/${coachWhatsAppDigits()}`;
  if (!prefill?.trim()) return base;
  return `${base}?text=${encodeURIComponent(prefill.trim())}`;
}

export const COACH_WHATSAPP_PREFILL_DEFAULT =
  "Hola Alejandro, me gustaría información para reservar una clase de snowboard en Sierra Nevada.";

export const COACH_WHATSAPP_ALUMNO_INTRO =
  "Escríbeme por WhatsApp para reservar, cambiar fechas o resolver dudas. Tras confirmar tu plaza, puedes pagar con tarjeta en la web o acordar el pago conmigo.";

/** Texto breve para formularios y pies de reserva */
export const BOOKING_PAYMENT_OPTIONS_NOTE =
  `Al reservar pagas con tarjeta (señal del 30% o el total). El resto, si aplica, en ${BOOKING_BALANCE_ON_CLASS_DAY}. También puedes escribirme por WhatsApp.`;

/** Bloque HTML para emails a alumnos */
export function coachWhatsAppHtmlForEmail(): string {
  const url = getCoachWhatsAppUrl();
  return `
    <p style="margin:16px 0 0;font-size:14px;color:#a1a1aa;line-height:1.5">
      <strong style="color:#e4e4e7">Alumnos con cuenta:</strong> escríbeme por
      <a href="${url}" style="color:#7bc49a">WhatsApp</a> (${COACH_WHATSAPP_DISPLAY})
      para dudas o futuras reservas.
    </p>
  `;
}
