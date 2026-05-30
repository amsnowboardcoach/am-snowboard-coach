/** Punto de encuentro para clases en pista (Sierra Nevada) */
export const BOOKING_MEETING_POINT =
  "Borreguiles, a la salida del telecabina Al-Andalus";

export const BOOKING_MEETING_POINT_LABEL = "Punto de encuentro";

/** Ubicación en Google Calendar, JSON-LD y mapas */
export const BOOKING_LOCATION = `Sierra Nevada — ${BOOKING_MEETING_POINT}`;

export const BOOKING_NOT_INCLUDED =
  "El forfait y el material de snowboard no están incluidos en el precio de la clase.";

export const BOOKING_ADVISORY =
  "Si lo necesitas, te asesoro sobre forfait, alquiler y equipo antes de la sesión.";

/** Una línea para Stripe, push, etc. */
export const BOOKING_PRACTICAL_SHORT = `${BOOKING_NOT_INCLUDED} ${BOOKING_ADVISORY}`;

export function bookingPracticalInfoPlainLines(): string[] {
  return [
    `${BOOKING_MEETING_POINT_LABEL}: ${BOOKING_MEETING_POINT}`,
    BOOKING_NOT_INCLUDED,
    BOOKING_ADVISORY,
  ];
}

/** Bloque HTML para emails de clase en pista */
export function bookingPracticalInfoHtml(): string {
  return `
    <p style="margin:16px 0 0;font-size:14px;color:#a1a1aa;line-height:1.5">
      <strong style="color:#e4e4e7">${BOOKING_MEETING_POINT_LABEL}:</strong> ${BOOKING_MEETING_POINT} (Sierra Nevada).
    </p>
    <p style="margin:8px 0 0;font-size:14px;color:#a1a1aa;line-height:1.5">
      ${BOOKING_NOT_INCLUDED} ${BOOKING_ADVISORY}
    </p>
  `;
}
