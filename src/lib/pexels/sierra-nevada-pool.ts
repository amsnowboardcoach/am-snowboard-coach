import {
  searchPhotos,
  searchVideo,
  searchVideos,
  type PexelsPhoto,
  type PexelsVideo,
} from "@/lib/pexels/client";

const SIERRA_KEYWORDS =
  /sierra\s*nevada|pradollano|sulayr|granada|andaluc[ií]a|\bspain\b|españa/i;
const EXCLUDE_KEYWORDS =
  /turkey|türkiye|doyran|austria|switzerland|norway|canada|colorado|japan|chile|patagonia/i;

function isRelevantSierraPhoto(photo: PexelsPhoto): boolean {
  const alt = photo.alt.toLowerCase();
  if (EXCLUDE_KEYWORDS.test(alt)) return false;
  if (SIERRA_KEYWORDS.test(alt)) return true;
  return (
    /snow|ski|snowboard|pista|estaci[oó]n/i.test(alt) &&
    /spain|españa|granada/i.test(alt)
  );
}

/** Búsquedas orientadas a Sierra Nevada (Granada), todas distintas */
const PHOTO_QUERIES = [
  "Sierra Nevada snowboard España",
  "Sierra Nevada estación esquí nieve Granada",
  "snowboard Sierra Nevada Granada invierno",
  "Sierra Nevada pista snowboard Snowpark Sulayr",
  "esquiador snowboard Sierra Nevada España montaña",
  "Sierra Nevada telesilla nieve España",
  "Sierra Nevada estación invierno Granada",
  "snowboard carving Sierra Nevada España",
  "Sierra Nevada panorama nieve cordillera Granada",
  "snowboard freestyle Sierra Nevada España",
  "Sierra Nevada resort snow Spain mountains",
  "monitor snowboard Sierra Nevada pista",
  "snowboard instructor teaching student snow mountain",
] as const;

const VIDEO_QUERIES = [
  "Sierra Nevada ski resort Spain snow",
  "snowboard mountains Granada Spain winter",
  "ski slope Sierra Nevada Spain",
  "snowboard resort Spain winter",
] as const;

export async function collectSierraNevadaPhotos(
  minUnique = 18,
): Promise<PexelsPhoto[]> {
  const seen = new Set<number>();
  const pool: PexelsPhoto[] = [];

  const batches = await Promise.all(
    PHOTO_QUERIES.map((q, i) => searchPhotos(q, 6, 1 + (i % 2))),
  );

  const add = (photo: PexelsPhoto, strict: boolean) => {
    if (seen.has(photo.id)) return;
    if (strict && !isRelevantSierraPhoto(photo)) return;
    seen.add(photo.id);
    pool.push(photo);
  };

  for (const batch of batches) {
    for (const photo of batch) {
      add(photo, true);
    }
  }

  if (pool.length < minUnique) {
    for (const q of PHOTO_QUERIES) {
      const extra = await searchPhotos(q, 10, 2);
      for (const photo of extra) {
        add(photo, true);
        if (pool.length >= minUnique) break;
      }
      if (pool.length >= minUnique) break;
    }
  }

  if (pool.length < minUnique) {
    const extra = await searchPhotos(
      "Sierra Nevada snow mountain Spain winter sport",
      40,
      1,
    );
    for (const photo of extra) {
      add(photo, false);
      if (pool.length >= minUnique) break;
    }
  }

  return pool;
}

export function pickPhoto(
  pool: PexelsPhoto[],
  index: number,
): PexelsPhoto | undefined {
  return pool[index];
}

export async function collectSierraNevadaVideos(): Promise<PexelsVideo[]> {
  const seen = new Set<string>();
  const videos: PexelsVideo[] = [];

  const batches = await Promise.all(
    VIDEO_QUERIES.map((q) => searchVideos(q, 3)),
  );

  for (const batch of batches) {
    for (const v of batch) {
      if (seen.has(v.src)) continue;
      seen.add(v.src);
      videos.push({
        ...v,
        alt: v.alt.includes("Sierra") ? v.alt : `${v.alt} — Sierra Nevada, España`,
      });
    }
  }

  if (videos.length === 0) {
    const fallback = await searchVideo("Sierra Nevada snow resort Spain");
    if (fallback) videos.push(fallback);
  }

  return videos.slice(0, 6);
}
