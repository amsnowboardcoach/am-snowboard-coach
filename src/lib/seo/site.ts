import { getAppBaseUrl } from "@/constants/project";

export const SITE_NAME = "AM Snowboard Coach";
export const SITE_TAGLINE = "Clases de snowboard en Sierra Nevada";
export const DEFAULT_DESCRIPTION =
  "Clases de snowboard en Sierra Nevada (Granada) con Alejandro Martín. Iniciación, carving y freestyle en Sulayr. Reserva online, área de alumno con vídeos y seguimiento personalizado.";

export const SITE_KEYWORDS = [
  "clases snowboard Sierra Nevada",
  "profesor snowboard Granada",
  "snowboard Granada",
  "clases snowboard Sulayr",
  "monitor snowboard Sierra Nevada",
  "curso snowboard España",
  "Alejandro Martín snowboard",
  "AM Snowboard Coach",
];

export function getSiteUrl(): string {
  return getAppBaseUrl();
}

export const COACH_NAME = "Alejandro Martín";
export const LOCALITY = "Sierra Nevada, Granada";
export const REGION = "Granada, Andalucía, España";
