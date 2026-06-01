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
