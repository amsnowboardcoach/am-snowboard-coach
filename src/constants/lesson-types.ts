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
    name: "Freestyle en Sulayr",
    description:
      "Saltos, rails y líneas en Sulayr con progresión segura en el snowpark de Sierra Nevada.",
    slug: "freestyle-sulayr",
  },
] as const;

export type LessonTypeId = (typeof LESSON_TYPES)[number]["id"];
