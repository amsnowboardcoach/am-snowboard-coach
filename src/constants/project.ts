/** Email principal del proyecto / coach */
export const COACH_EMAIL = "amsnowboardcoach@gmail.com";

export { BOOKING_LOCATION } from "@/constants/booking-info";

/** Aviso mínimo antes de la primera hora de la clase */
export const MIN_BOOKING_NOTICE_HOURS = 2;

/** URL pública de la web (emails y enlaces al panel coach) */
export function getAppBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
