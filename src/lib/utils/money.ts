export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

export function centsToEuros(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

export function parseEurosInput(value: string): number {
  const normalized = value.replace(",", ".").trim();
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : 0;
}
