import { TRICK_CATEGORY_LABELS } from "@/constants/tricks-catalog";
import { TRICK_STATUS_LABEL } from "@/constants/trick-status";
import type { TrickCategory } from "@/constants/tricks-catalog";
import type { TrickStatus } from "@/types/tricks";

export function buildPassportTribeCaption(input: {
  trickName: string;
  status: TrickStatus;
  category: TrickCategory;
  extra?: string;
}): string {
  const statusLabel = TRICK_STATUS_LABEL[input.status];
  const categoryLabel = TRICK_CATEGORY_LABELS[input.category];
  const base = `Logro del pasaporte: ${input.trickName} — ${statusLabel} (${categoryLabel})`;
  const extra = input.extra?.trim();
  if (!extra) return base.slice(0, 500);
  const combined = `${base}\n${extra}`;
  return combined.slice(0, 500);
}
