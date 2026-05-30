import type { SessionTimeSlot } from "@/constants/session-schedules";
import type { AvailableSlotOption } from "@/lib/booking/availability";

export function parseSlotStartMinutes(start: string): number {
  const [h, m] = start.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function freeSlotIdsForDate(
  date: string,
  availableSlots: AvailableSlotOption[],
): Set<string> {
  return new Set(
    availableSlots.filter((o) => o.date === date).map((o) => o.slotId),
  );
}

export function isSlotFreeOnAllDates(
  slotId: string,
  dates: string[],
  availableSlots: AvailableSlotOption[],
): boolean {
  return dates.every((date) =>
    availableSlots.some((o) => o.date === date && o.slotId === slotId),
  );
}

/** Turno libre más cercano por hora de inicio al turno pedido (mismo día). */
export function nearestFreeSlotId(
  sessionSlots: SessionTimeSlot[],
  targetSlotId: string,
  freeSlotIds: Iterable<string>,
): string | null {
  const target = sessionSlots.find((s) => s.id === targetSlotId);
  if (!target) return null;

  const targetMin = parseSlotStartMinutes(target.start);
  const freeSet = new Set(freeSlotIds);
  let best: SessionTimeSlot | null = null;
  let bestDist = Infinity;

  for (const slot of sessionSlots) {
    if (!freeSet.has(slot.id)) continue;
    const dist = Math.abs(parseSlotStartMinutes(slot.start) - targetMin);
    if (dist < bestDist) {
      best = slot;
      bestDist = dist;
    }
  }

  return best?.id ?? null;
}

export interface PerDaySlotAlternative {
  date: string;
  requestedSlotId: string;
  suggestedSlotId: string;
  suggestedLabel: string;
}

/** Alternativas por día cuando el turno pedido está ocupado. */
export function alternativesForOccupiedSlot(
  sessionSlots: SessionTimeSlot[],
  targetSlotId: string,
  dates: string[],
  availableSlots: AvailableSlotOption[],
): PerDaySlotAlternative[] {
  const out: PerDaySlotAlternative[] = [];

  for (const date of dates) {
    const free = freeSlotIdsForDate(date, availableSlots);
    if (free.has(targetSlotId)) continue;

    const suggestedSlotId = nearestFreeSlotId(sessionSlots, targetSlotId, free);
    if (!suggestedSlotId) continue;

    const suggestedLabel =
      sessionSlots.find((s) => s.id === suggestedSlotId)?.label ??
      suggestedSlotId;
    out.push({
      date,
      requestedSlotId: targetSlotId,
      suggestedSlotId,
      suggestedLabel,
    });
  }

  return out;
}

/** Misma alternativa en todos los días en conflicto. */
export function unifiedAlternativeSlotId(
  alternatives: PerDaySlotAlternative[],
): string | null {
  if (alternatives.length === 0) return null;
  const first = alternatives[0]!.suggestedSlotId;
  return alternatives.every((a) => a.suggestedSlotId === first) ? first : null;
}

export function formatSlotConflictMessage(
  sessionSlots: SessionTimeSlot[],
  targetSlotId: string,
  pickedDates: string[],
  availableSlots: AvailableSlotOption[],
  formatDate: (date: string) => string,
): string {
  const targetLabel =
    sessionSlots.find((s) => s.id === targetSlotId)?.label ?? "este turno";
  const alts = alternativesForOccupiedSlot(
    sessionSlots,
    targetSlotId,
    pickedDates,
    availableSlots,
  );

  if (alts.length === 0) {
    return `El turno ${targetLabel} no está libre en todos los días elegidos. Prueba otro horario o cambia las fechas.`;
  }

  const unified = unifiedAlternativeSlotId(alts);
  if (
    unified &&
    isSlotFreeOnAllDates(unified, pickedDates, availableSlots)
  ) {
    const uLabel = sessionSlots.find((s) => s.id === unified)?.label ?? unified;
    return `El turno ${targetLabel} no está libre en todos los días. Prueba ${uLabel} (el horario libre más cercano en común).`;
  }

  const lines = alts
    .map((a) => `${formatDate(a.date)} → ${a.suggestedLabel}`)
    .join(" · ");
  return `El turno ${targetLabel} no está libre en todos los días. Alternativa más cercana: ${lines}.`;
}
