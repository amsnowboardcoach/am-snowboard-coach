import type { UserProfile } from "@/types/firestore";

export const BOOKING_LEVEL_OPTIONS = [
  { id: "beginner" as const, label: "Principiante" },
  { id: "intermediate" as const, label: "Intermedio" },
  { id: "advanced" as const, label: "Avanzado" },
] as const;

export type BookingLevelId = (typeof BOOKING_LEVEL_OPTIONS)[number]["id"];

export function bookingLevelLabel(
  level: BookingLevelId | "" | undefined,
): string | null {
  if (!level) return null;
  return BOOKING_LEVEL_OPTIONS.find((o) => o.id === level)?.label ?? null;
}

/** Etiqueta de nivel en perfil / panel coach. */
export function alumnoLevelLabel(
  level: UserProfile["level"] | undefined,
): string {
  return bookingLevelLabel(level) ?? "Sin definir";
}

/** Mínimo 9 dígitos (España y formato internacional con +). */
export function isValidBookingPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

export function formatBookingContactForNotes(input: {
  phone: string;
  level?: BookingLevelId | "";
  objectives?: string;
}): string {
  const parts: string[] = [`Tel: ${input.phone.trim()}`];
  const levelLabel = bookingLevelLabel(input.level);
  if (levelLabel) parts.push(`Nivel: ${levelLabel}`);
  const objectives = input.objectives?.trim();
  if (objectives) parts.push(`Objetivos: ${objectives}`);
  return parts.join(" · ");
}

export function formatBookingContactSummary(input: {
  phone: string;
  level?: BookingLevelId | "";
  objectives?: string;
}): string {
  const parts = [input.phone.trim()];
  const levelLabel = bookingLevelLabel(input.level);
  if (levelLabel) parts.push(levelLabel);
  if (input.objectives?.trim()) {
    const short =
      input.objectives.trim().length > 48
        ? `${input.objectives.trim().slice(0, 45)}…`
        : input.objectives.trim();
    parts.push(short);
  }
  return parts.join(" · ");
}

export function levelFromProfile(
  level: UserProfile["level"] | undefined,
): BookingLevelId | "" {
  if (
    level === "beginner" ||
    level === "intermediate" ||
    level === "advanced"
  ) {
    return level;
  }
  return "";
}
