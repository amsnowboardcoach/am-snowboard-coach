import type { LessonTypeId } from "@/constants/lesson-types";
import { LESSON_TYPES } from "@/constants/lesson-types";
import {
  getSessionDuration,
  type SessionDurationId,
} from "@/constants/session-schedules";

export type ReservarLinkParams = {
  duracion?: SessionDurationId;
  estilo?: LessonTypeId;
  tipo?: "video";
};

export function parseReservarDuracion(
  value: string | null | undefined,
): SessionDurationId | null {
  if (!value) return null;
  return getSessionDuration(value as SessionDurationId)
    ? (value as SessionDurationId)
    : null;
}

export function parseReservarEstilo(
  value: string | null | undefined,
): LessonTypeId | null {
  if (!value) return null;
  return LESSON_TYPES.some((l) => l.id === value) ? (value as LessonTypeId) : null;
}

/** Enlace a la central de reservas con duración y/o estilo preseleccionados */
export function reservarHref(params?: ReservarLinkParams): string {
  const q = new URLSearchParams();
  if (params?.duracion) q.set("duracion", params.duracion);
  if (params?.estilo) q.set("estilo", params.estilo);
  if (params?.tipo === "video") q.set("tipo", "video");
  const query = q.toString();
  return query ? `/reservar?${query}` : "/reservar";
}
