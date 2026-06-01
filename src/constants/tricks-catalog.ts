export type TrickCategory =
  | "flat"
  | "jumps"
  | "rails"
  | "freeride";

export interface TrickCatalogEntry {
  id: string;
  name: string;
  slug: string;
  category: TrickCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
  description: string;
  sortOrder: number;
}

/**
 * Catálogo del Pasaporte de Trucos (progresión flat: pluma → guirnalda → giros verde → carving azul/roja).
 * Las descripciones las ve el alumno en cada tarjeta; el coach desbloquea estados en el panel.
 */
export const TRICKS_CATALOG: TrickCatalogEntry[] = [
  {
    id: "pluma-backside",
    name: "Pluma backside (talones)",
    slug: "pluma-backside",
    category: "flat",
    difficulty: 1,
    description:
      "Descenso en zigzag en pista verde, controlando el canto de talones (backside).",
    sortOrder: 1,
  },
  {
    id: "pluma-frontside",
    name: "Pluma frontside (puntas)",
    slug: "pluma-frontside",
    category: "flat",
    difficulty: 1,
    description:
      "Descenso en zigzag en pista verde, controlando el canto de puntas (frontside).",
    sortOrder: 2,
  },
  {
    id: "garland",
    name: "Guirnalda",
    slug: "garland",
    category: "flat",
    difficulty: 1,
    description:
      "Transiciones en C sin cambio de canto (mismo canto de talón o de punta).",
    sortOrder: 3,
  },
  {
    id: "basic-turns",
    name: "Giros básicos",
    slug: "basic-turns",
    category: "flat",
    difficulty: 2,
    description: "Giros básicos enlazados en pista verde.",
    sortOrder: 4,
  },
  {
    id: "advanced-carving",
    name: "Giros avanzados (carving)",
    slug: "advanced-carving",
    category: "flat",
    difficulty: 4,
    description:
      "Giros cerrados y carving en pista azul o roja: cantos marcados, velocidad y control.",
    sortOrder: 5,
  },
  {
    id: "switch-riding",
    name: "Switch",
    slug: "switch-riding",
    category: "flat",
    difficulty: 3,
    description:
      "Deslizar con el pie débil delante en pista azul, con giros controlados.",
    sortOrder: 6,
  },
  {
    id: "ollie",
    name: "Ollie",
    slug: "ollie",
    category: "jumps",
    difficulty: 2,
    description: "Salto estático en plano (sin kicker), despegue y aterrizaje controlados.",
    sortOrder: 10,
  },
  {
    id: "straight-air",
    name: "Straight air",
    slug: "straight-air",
    category: "jumps",
    difficulty: 2,
    description: "Salto recto en kicker pequeño, aterrizaje estable.",
    sortOrder: 11,
  },
  {
    id: "indy-grab",
    name: "Indy grab",
    slug: "indy-grab",
    category: "jumps",
    difficulty: 3,
    description: "Agarre con la mano trasera entre los pies en el aire.",
    sortOrder: 12,
  },
  {
    id: "frontside-180",
    name: "Frontside 180",
    slug: "frontside-180",
    category: "jumps",
    difficulty: 4,
    description: "Media vuelta frontside al salir del kicker, aterrizaje switch o natural.",
    sortOrder: 13,
  },
  {
    id: "50-50",
    name: "50-50",
    slug: "50-50",
    category: "rails",
    difficulty: 3,
    description: "Caja o barra en sentido de la marcha (50-50), entrada y salida limpias.",
    sortOrder: 20,
  },
  {
    id: "boardslide",
    name: "Boardslide",
    slug: "boardslide",
    category: "rails",
    difficulty: 4,
    description: "Deslizar perpendicular sobre caja o barra (boardslide).",
    sortOrder: 21,
  },
  {
    id: "powder-turns",
    name: "Giros en pow",
    slug: "powder-turns",
    category: "freeride",
    difficulty: 3,
    description: "Giros fluidos y control en nieve virgen, postura centrada.",
    sortOrder: 30,
  },
  {
    id: "short-turns-steep",
    name: "Giros cortos en pistas rojas",
    slug: "short-turns-steep",
    category: "freeride",
    difficulty: 4,
    description: "Giros cortos y rápidos en pendiente fuerte (pista roja o negra).",
    sortOrder: 31,
  },
];

export const TRICK_CATEGORY_LABELS: Record<TrickCategory, string> = {
  flat: "Flat & pista",
  jumps: "Saltos",
  rails: "Rails & cajones",
  freeride: "Freeride",
};
