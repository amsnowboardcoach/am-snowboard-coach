import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { AvailableSlotOption } from "@/lib/booking/availability";

/** Líneas de resumen en orden: día → estilo → horario → personas */
export function formatReservationSummaryLines(options: {
  selectedDays: AvailableSlotOption[];
  participantCount: number;
  lessonName?: string;
  notes?: string;
}): { day: string; schedule: string; people: string; style: string; notes: string } {
  const { selectedDays, participantCount, lessonName, notes } = options;
  const day =
    selectedDays.length === 0
      ? "—"
      : selectedDays
          .map((d) =>
            format(parseISO(d.date), "EEE d MMM yyyy", { locale: es }),
          )
          .join(" · ");
  const schedule =
    selectedDays.length === 0
      ? "—"
      : selectedDays.length === 1
        ? selectedDays[0]!.label
        : selectedDays
            .map(
              (d) =>
                `${format(parseISO(d.date), "d MMM", { locale: es })} ${d.label}`,
            )
            .join(" · ");
  const people = `${participantCount} ${
    participantCount === 1 ? "persona" : "personas"
  } en pista`;
  return {
    day,
    schedule,
    people,
    style: lessonName ?? "—",
    notes: notes?.trim() || "—",
  };
}
