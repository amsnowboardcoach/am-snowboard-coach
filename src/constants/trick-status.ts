import type { TrickStatus } from "@/types/tricks";

export const TRICK_STATUS_LABEL: Record<TrickStatus, string> = {
  locked: "Bloqueado",
  in_progress: "En progreso",
  unlocked: "Desbloqueado",
  mastered: "Dominado",
};

/** Estados del pasaporte que el alumno puede compartir en La Tribu. */
export const TRIBE_SHAREABLE_TRICK_STATUSES: TrickStatus[] = [
  "in_progress",
  "unlocked",
  "mastered",
];

export function isTribeShareableTrickStatus(
  status: TrickStatus,
): status is "in_progress" | "unlocked" | "mastered" {
  return TRIBE_SHAREABLE_TRICK_STATUSES.includes(status);
}
