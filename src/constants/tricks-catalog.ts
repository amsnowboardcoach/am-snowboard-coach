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

export const TRICKS_CATALOG: TrickCatalogEntry[] = [
  {
    id: "pluma-backside",
    name: "Pluma backside (talones)",
    slug: "pluma-backside",
    category: "flat",
    difficulty: 1,
    description:
      "Descenso en zigzag controlando el canto de talones (backside).",
    sortOrder: 1,
  },
  {
    id: "pluma-frontside",
    name: "Pluma frontside (puntas)",
    slug: "pluma-frontside",
    category: "flat",
    difficulty: 1,
    description:
      "Descenso en zigzag controlando el canto de puntas (frontside).",
    sortOrder: 2,
  },
  {
    id: "garland",
    name: "Guirnalda",
    slug: "garland",
    category: "flat",
    difficulty: 1,
    description: "Transiciones en C con cambio de canto.",
    sortOrder: 3,
  },
  {
    id: "basic-turns",
    name: "Giros básicos",
    slug: "basic-turns",
    category: "flat",
    difficulty: 2,
    description: "Giros cerrados en pista azul.",
    sortOrder: 4,
  },
  {
    id: "advanced-carving",
    name: "Giros avanzados (carving)",
    slug: "advanced-carving",
    category: "flat",
    difficulty: 4,
    description:
      "Arcos amplios con cantos marcados, velocidad y control en pista dura.",
    sortOrder: 5,
  },
  {
    id: "switch-riding",
    name: "Switch",
    slug: "switch-riding",
    category: "flat",
    difficulty: 3,
    description: "Deslizar con el pie débil delante.",
    sortOrder: 6,
  },
  {
    id: "ollie",
    name: "Ollie",
    slug: "ollie",
    category: "jumps",
    difficulty: 2,
    description: "Salto estático sin rampa.",
    sortOrder: 10,
  },
  {
    id: "straight-air",
    name: "Straight air",
    slug: "straight-air",
    category: "jumps",
    difficulty: 2,
    description: "Salto en kickers pequeños.",
    sortOrder: 11,
  },
  {
    id: "indy-grab",
    name: "Indy grab",
    slug: "indy-grab",
    category: "jumps",
    difficulty: 3,
    description: "Agarre entre los pies en el aire.",
    sortOrder: 12,
  },
  {
    id: "frontside-180",
    name: "Frontside 180",
    slug: "frontside-180",
    category: "jumps",
    difficulty: 4,
    description: "Media vuelta frontside en salto.",
    sortOrder: 13,
  },
  {
    id: "50-50",
    name: "50-50",
    slug: "50-50",
    category: "rails",
    difficulty: 3,
    description: "Caja o barra recta.",
    sortOrder: 20,
  },
  {
    id: "boardslide",
    name: "Boardslide",
    slug: "boardslide",
    category: "rails",
    difficulty: 4,
    description: "Deslizar perpendicular en caja.",
    sortOrder: 21,
  },
  {
    id: "powder-turns",
    name: "Giros en pow",
    slug: "powder-turns",
    category: "freeride",
    difficulty: 3,
    description: "Control en nieve virgen.",
    sortOrder: 30,
  },
  {
    id: "short-turns-steep",
    name: "Giros cortos en pistas rojas",
    slug: "short-turns-steep",
    category: "freeride",
    difficulty: 4,
    description: "Pendiente fuerte, radio corto.",
    sortOrder: 31,
  },
];

export const TRICK_CATEGORY_LABELS: Record<TrickCategory, string> = {
  flat: "Flat & pista",
  jumps: "Saltos",
  rails: "Rails & cajones",
  freeride: "Freeride",
};
