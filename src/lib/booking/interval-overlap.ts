/** true si [aStart, aEnd) solapa con [bStart, bEnd) */
export function intervalsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/** El intervalo [start, end) no debe solapar ningún bloque ocupado. */
export function isIntervalFreeOfBusy(
  start: Date,
  end: Date,
  busy: { start: Date; end: Date }[],
): boolean {
  return !busy.some((b) => intervalsOverlap(start, end, b.start, b.end));
}

/** Une bloques que se solapan (varios calendarios o reservas). */
export function mergeBusyIntervals(
  busy: { start: Date; end: Date }[],
): { start: Date; end: Date }[] {
  if (busy.length === 0) return [];
  const sorted = [...busy].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
  const merged: { start: Date; end: Date }[] = [
    { start: sorted[0]!.start, end: sorted[0]!.end },
  ];
  for (let i = 1; i < sorted.length; i += 1) {
    const block = sorted[i]!;
    const last = merged[merged.length - 1]!;
    if (block.start.getTime() <= last.end.getTime()) {
      if (block.end.getTime() > last.end.getTime()) {
        last.end = block.end;
      }
    } else {
      merged.push({ start: block.start, end: block.end });
    }
  }
  return merged;
}

/**
 * Huecos más cortos que la clase mínima (2 h) no son reservables: se tratan como ocupados.
 * Ej.: reserva 10:00–15:00 y otra 14:00–16:00 dejan 13:00–14:00 libre en Google, pero no hay franja 2h/3h.
 */
export function mergeBusyWithShortGaps(
  busy: { start: Date; end: Date }[],
  minGapMs: number,
): { start: Date; end: Date }[] {
  const merged = mergeBusyIntervals(busy);
  if (merged.length <= 1 || minGapMs <= 0) return merged;

  const bridged: { start: Date; end: Date }[] = [
    { start: merged[0]!.start, end: merged[0]!.end },
  ];
  for (let i = 1; i < merged.length; i += 1) {
    const block = merged[i]!;
    const last = bridged[bridged.length - 1]!;
    const gapMs = block.start.getTime() - last.end.getTime();
    if (gapMs > 0 && gapMs < minGapMs) {
      last.end = block.end.getTime() > last.end.getTime() ? block.end : last.end;
    } else {
      bridged.push({ start: block.start, end: block.end });
    }
  }
  return bridged;
}
