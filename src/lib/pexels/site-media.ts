import { FALLBACK_SITE_MEDIA } from "@/constants/site-images";
import {
  collectSierraNevadaPhotos,
  collectSierraNevadaVideos,
  pickPhoto,
} from "@/lib/pexels/sierra-nevada-pool";
import { searchVideo, type PexelsPhoto, type PexelsVideo } from "@/lib/pexels/client";

export interface MediaSlot {
  image: { src: string; alt: string };
  video?: PexelsVideo;
  credit?: string;
}

export interface SiteMedia {
  hero: MediaSlot;
  pista: MediaSlot;
  clase: MediaSlot;
  sierra: MediaSlot;
  coach: MediaSlot;
  reservar: MediaSlot;
  /** Hero y retrato de /sobre-mi (monitor, clase en pista) */
  sobreMi: MediaSlot;
  sobreMiPortrait: MediaSlot;
  lessonCards: PexelsPhoto[];
  gallery: PexelsPhoto[];
  videos: PexelsVideo[];
}

/** Índices fijos en el pool para que cada sección use una foto distinta */
const SLOT_INDEX = {
  hero: 0,
  pista: 1,
  clase: 2,
  sierra: 3,
  coach: 4,
  reservar: 5,
  lessonStart: 6,
  galleryStart: 9,
  sobreMi: 10,
  sobreMiPortrait: 11,
} as const;

function slotFromPhoto(
  photo: PexelsPhoto | undefined,
  fallback: { src: string; alt: string },
): MediaSlot {
  if (!photo) return { image: fallback };
  return {
    image: { src: photo.src, alt: photo.alt },
    credit: photo.photographer,
  };
}

export async function getSiteMedia(): Promise<SiteMedia> {
  const fb = FALLBACK_SITE_MEDIA;
  const pool = await collectSierraNevadaPhotos(18);
  const videos = await collectSierraNevadaVideos();

  const heroVideo =
    (await searchVideo("Sierra Nevada snowboard ski resort Spain")) ??
    videos[0];

  const hero: MediaSlot = {
    ...slotFromPhoto(pickPhoto(pool, SLOT_INDEX.hero), fb.hero.image),
    video: heroVideo
      ? {
          ...heroVideo,
          alt: "Snowboard en Sierra Nevada, España",
        }
      : undefined,
  };

  const lessonCards = [
    pickPhoto(pool, SLOT_INDEX.lessonStart),
    pickPhoto(pool, SLOT_INDEX.lessonStart + 1),
    pickPhoto(pool, SLOT_INDEX.lessonStart + 2),
  ].filter((p): p is PexelsPhoto => Boolean(p));

  const gallery = pool.slice(
    SLOT_INDEX.galleryStart,
    SLOT_INDEX.galleryStart + 6,
  );

  return {
    hero,
    pista: slotFromPhoto(pickPhoto(pool, SLOT_INDEX.pista), fb.pista.image),
    clase: slotFromPhoto(pickPhoto(pool, SLOT_INDEX.clase), fb.clase.image),
    sierra: slotFromPhoto(pickPhoto(pool, SLOT_INDEX.sierra), fb.sierra.image),
    coach: slotFromPhoto(pickPhoto(pool, SLOT_INDEX.coach), fb.coach.image),
    reservar: slotFromPhoto(
      pickPhoto(pool, SLOT_INDEX.reservar),
      fb.reservar.image,
    ),
    sobreMi: slotFromPhoto(
      pickPhoto(pool, SLOT_INDEX.sobreMi),
      fb.sobreMi.image,
    ),
    sobreMiPortrait: slotFromPhoto(
      pickPhoto(pool, SLOT_INDEX.sobreMiPortrait),
      fb.sobreMiPortrait.image,
    ),
    lessonCards:
      lessonCards.length >= 3
        ? lessonCards
        : pool.slice(6, 9).length >= 3
          ? pool.slice(6, 9)
          : [
              {
                id: 0,
                src: fb.clase.image.src,
                alt: "Snowboard en Sierra Nevada, España",
                photographer: "",
                url: "",
              },
              {
                id: 0,
                src: fb.sierra.image.src,
                alt: "Sierra Nevada, España",
                photographer: "",
                url: "",
              },
              {
                id: 0,
                src: fb.pista.image.src,
                alt: "Pista en Sierra Nevada, España",
                photographer: "",
                url: "",
              },
            ],
    gallery,
    videos,
  };
}
