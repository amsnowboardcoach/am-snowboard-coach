const PEXELS_API = "https://api.pexels.com";

export interface PexelsPhoto {
  id: number;
  src: string;
  alt: string;
  photographer: string;
  url: string;
}

export interface PexelsVideo {
  src: string;
  poster: string;
  alt: string;
  duration: number;
}

function apiKey(): string | null {
  return process.env.PEXELS_API_KEY?.trim() || null;
}

async function pexelsFetch<T>(path: string): Promise<T | null> {
  const key = apiKey();
  if (!key) return null;

  try {
    const res = await fetch(`${PEXELS_API}${path}`, {
      headers: { Authorization: key },
      next: { revalidate: 86_400 },
    });
    if (!res.ok) {
      console.error("[pexels]", path, res.status);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error("[pexels]", path, err);
    return null;
  }
}

type PhotoResponse = {
  photos: Array<{
    id: number;
    alt: string;
    photographer: string;
    url: string;
    src: { large2x: string; landscape: string; original: string };
  }>;
};

function mapPhoto(
  photo: PhotoResponse["photos"][number],
  context: string,
): PexelsPhoto {
  const baseAlt = photo.alt?.trim() || context;
  const alt = /sierra\s*nevada|pradollano|granada|sulayr/i.test(baseAlt)
    ? baseAlt
    : `${baseAlt} — Sierra Nevada, España`;

  return {
    id: photo.id,
    src: photo.src.landscape || photo.src.large2x,
    alt,
    photographer: photo.photographer,
    url: photo.url,
  };
}

type VideoResponse = {
  videos: Array<{
    image: string;
    duration: number;
    video_files: Array<{
      link: string;
      width: number;
      quality: string;
    }>;
  }>;
};

export async function searchPhotos(
  query: string,
  perPage = 6,
  page = 1,
): Promise<PexelsPhoto[]> {
  const data = await pexelsFetch<PhotoResponse>(
    `/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=landscape`,
  );
  return (data?.photos ?? []).map((photo) => mapPhoto(photo, query));
}

export async function searchPhoto(
  query: string,
  perPage = 1,
): Promise<PexelsPhoto | null> {
  const photos = await searchPhotos(query, perPage, 1);
  return photos[0] ?? null;
}

export async function searchVideo(query: string): Promise<PexelsVideo | null> {
  const data = await pexelsFetch<VideoResponse>(
    `/videos/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
  );
  const video = data?.videos?.[0];
  if (!video?.video_files?.length) return null;

  const file =
    video.video_files.find((f) => f.quality === "hd") ??
    [...video.video_files].sort((a, b) => b.width - a.width)[0];

  if (!file?.link) return null;

  return {
    src: file.link,
    poster: video.image,
    alt: query,
    duration: video.duration,
  };
}

export async function searchVideos(
  query: string,
  perPage = 4,
): Promise<PexelsVideo[]> {
  const data = await pexelsFetch<VideoResponse>(
    `/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
  );

  return (data?.videos ?? [])
    .map((video) => {
      const file =
        video.video_files?.find((f) => f.quality === "hd") ??
        video.video_files?.sort((a, b) => b.width - a.width)[0];
      if (!file?.link) return null;
      return {
        src: file.link,
        poster: video.image,
        alt: query,
        duration: video.duration,
      };
    })
    .filter((v): v is PexelsVideo => v !== null);
}
