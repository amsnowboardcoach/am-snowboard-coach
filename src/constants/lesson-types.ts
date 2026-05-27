export const LESSON_TYPES = [
  {
    id: "iniciacion",
    name: "Iniciación",
    description: "Primeros pasos en pista. Postura, control y seguridad.",
    slug: "iniciacion",
  },
  {
    id: "carving",
    name: "Carving",
    description: "Giros cerrados, cantos y velocidad controlada.",
    slug: "carving",
  },
  {
    id: "freestyle-sulayr",
    name: "Freestyle en Sulayr",
    description: "Park, saltos y progresión en el snowpark de Sierra Nevada.",
    slug: "freestyle-sulayr",
  },
] as const;

export type LessonTypeId = (typeof LESSON_TYPES)[number]["id"];
