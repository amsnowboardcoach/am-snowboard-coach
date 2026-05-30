import type { SessionDuration } from "@/constants/session-schedules";

/** Solo código legado Cal.com (desactivado en producción) */
const LEGACY_CALCOM_USERNAME = "am-snowboard-coach";

/** Slug completo para embed: usuario/evento */
export function buildCalLink(eventSlug: string): string {
  const user =
    process.env.NEXT_PUBLIC_CALCOM_USERNAME?.trim() || LEGACY_CALCOM_USERNAME;
  return `${user}/${eventSlug}`;
}

/** Enlace por defecto (compatibilidad con .env antiguo) */
export function getCalLink(): string | null {
  const legacy = process.env.NEXT_PUBLIC_CALCOM_CAL_LINK?.trim();
  if (legacy) return legacy;
  return null;
}

export function getCalLinkForSession(session: SessionDuration): string {
  return buildCalLink(session.calSlug);
}

export function isCalConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CALCOM_CAL_LINK?.trim() ||
      process.env.NEXT_PUBLIC_CALCOM_USERNAME?.trim() ||
      LEGACY_CALCOM_USERNAME,
  );
}
