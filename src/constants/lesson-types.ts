/** Etiqueta del botón «Estilo de clase» en el formulario de reserva (ChoiceButton). */
export const FREESTYLE_LESSON_CHOICE_LABEL = "Freestyle en Sulayr";

export const LESSON_TYPES = [
  {
    id: "iniciacion",
    name: "Iniciación",
    description:
      "Tu primera experiencia en pista con bases sólidas: postura, frenado y confianza desde el primer día.",
    slug: "iniciacion",
  },
  {
    id: "carving",
    name: "Carving",
    description:
      "Giros más cerrados, uso de cantos y velocidad con control en pistas azules y rojas.",
    slug: "carving",
  },
  {
    id: "freestyle-sulayr",
    name: FREESTYLE_LESSON_CHOICE_LABEL,
    publicName: "Freestyle en Snowpark Sulayr",
    description:
      "Saltos, rails y líneas en Snowpark Sulayr con progresión segura en el snowpark de Sierra Nevada.",
    slug: "freestyle-sulayr",
  },
] as const;

export type LessonTypeId = (typeof LESSON_TYPES)[number]["id"];

/** Nombre visible en web, emails y panel (no en el ChoiceButton de reserva). */
export function lessonPublicName(
  lesson: (typeof LESSON_TYPES)[number],
): string {
  const withPublic = lesson as (typeof lesson & { publicName?: string });
  return withPublic.publicName ?? lesson.name;
}
