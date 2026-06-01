import type { StaticImageData } from "next/image";
import type { LessonTypeId } from "@/constants/lesson-types";
import iniciacionImg from "@/assets/lesson-cards/iniciacion.jpg";
import carvingImg from "@/assets/lesson-cards/carving.jpg";
import freestyleImg from "@/assets/lesson-cards/freestyle-sulayr.jpg";

export type LessonCardImage = {
  src: StaticImageData;
  alt: string;
  objectPosition: string;
};

/** Fotos propias para tarjetas de tipos de clase (home, /clases) — import estático para el build */
export const LOCAL_LESSON_CARD_IMAGES: Record<LessonTypeId, LessonCardImage> = {
  iniciacion: {
    src: iniciacionImg,
    alt: "Monitor y alumna en clase de iniciación de snowboard, Sierra Nevada",
    objectPosition: "center 42%",
  },
  carving: {
    src: carvingImg,
    alt: "Snowboarder en carve en pista de Sierra Nevada",
    objectPosition: "center 48%",
  },
  "freestyle-sulayr": {
    src: freestyleImg,
    alt: "Snowboarder en salto en Snowpark Sulayr, Sierra Nevada",
    objectPosition: "center 32%",
  },
};

/** Respaldo si Pexels no está disponible */
export const FALLBACK_SITE_MEDIA = {
  hero: {
    image: {
      src: "https://images.unsplash.com/photo-1551524558-089a4ff416c9?w=1920&q=80",
      alt: "Snowboard en Sierra Nevada, España",
    },
  },
  pista: {
    image: {
      src: "https://images.unsplash.com/photo-1605540436102-df7e06711ad8?w=1200&q=80",
      alt: "Pistas de Sierra Nevada, Granada",
    },
  },
  clase: {
    image: {
      src: "https://images.unsplash.com/photo-1519904986952-783f3e629f72?w=1200&q=80",
      alt: "Clase de snowboard en Sierra Nevada",
    },
  },
  sierra: {
    image: {
      src: "https://images.unsplash.com/photo-1551632811-562b4d7f7f66?w=1200&q=80",
      alt: "Cordillera de Sierra Nevada, Granada",
    },
  },
  coach: {
    image: {
      src: "https://images.unsplash.com/photo-1522163186832-ffeeced64440?w=800&q=80",
      alt: "Monitor en pista, Sierra Nevada",
    },
  },
  sobreMi: {
    image: {
      src: "https://images.unsplash.com/photo-1519904986952-783f3e629f72?w=1600&q=80",
      alt: "Monitor de snowboard con alumno en Sierra Nevada",
    },
  },
  sobreMiPortrait: {
    image: {
      src: "https://images.unsplash.com/photo-1591279019529-929381550c80?w=900&q=80",
      alt: "Clase de snowboard en nieve, Sierra Nevada",
    },
  },
  reservar: {
    image: {
      src: "https://images.unsplash.com/photo-1471295253337-452af363e55f?w=1600&q=80",
      alt: "Estación de Sierra Nevada al atardecer",
    },
  },
} as const;