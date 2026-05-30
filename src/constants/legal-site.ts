import { DEFAULT_ISSUER } from "@/constants/issuer";
import { getAppBaseUrl } from "@/constants/project";
import { SITE_NAME } from "@/lib/seo/site";

/** Fecha de última revisión de textos legales (ISO). Actualizar al modificar políticas. */
export const LEGAL_LAST_UPDATED = "2026-05-27";

export const LEGAL_CONTROLLER = {
  tradeName: SITE_NAME,
  legalName: DEFAULT_ISSUER.legalName,
  taxId: DEFAULT_ISSUER.taxId,
  address: `${DEFAULT_ISSUER.address}, ${DEFAULT_ISSUER.postalCode} ${DEFAULT_ISSUER.city} (${DEFAULT_ISSUER.province}), España`,
  email: DEFAULT_ISSUER.email,
  phone: DEFAULT_ISSUER.phone,
  activity: DEFAULT_ISSUER.activityDescription,
  website: getAppBaseUrl(),
} as const;

export const LEGAL_PATHS = {
  terms: "/legal/terminos",
  privacy: "/legal/privacidad",
  cookies: "/legal/cookies",
} as const;

export const LEGAL_PRIVACY_EMAIL = DEFAULT_ISSUER.email;

/** Clave localStorage consentimiento cookies (versión 1). */
export const COOKIE_CONSENT_KEY = "am_cookie_consent_v1";
