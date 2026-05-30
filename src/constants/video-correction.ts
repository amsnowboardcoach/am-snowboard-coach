/** Servicio de corrección de vídeo (fuera de pista) */
export const VIDEO_CORRECTION_PRODUCT = {
  id: "video-correccion",
  name: "Video corrección",
  description:
    "Graba tu riding, envíalo desde tu área de alumno y recibe análisis y correcciones personalizadas de Alejandro.",
  priceEuros: 20,
  priceCents: 2000,
  unitLabel: "vídeo",
  minQuantity: 1,
  maxQuantity: 10,
} as const;

export function isVideoCorrectionProduct(lessonTypeId?: string | null): boolean {
  return lessonTypeId === VIDEO_CORRECTION_PRODUCT.id;
}

export function videoCorrectionTotalEuros(count: number): number {
  return VIDEO_CORRECTION_PRODUCT.priceEuros * count;
}

export function videoCorrectionTotalCents(count: number): number {
  return VIDEO_CORRECTION_PRODUCT.priceCents * count;
}

export function formatVideoCorrectionPrice(count = 1): string {
  const total = videoCorrectionTotalEuros(count);
  if (count <= 1) {
    return `${VIDEO_CORRECTION_PRODUCT.priceEuros} € por vídeo`;
  }
  return `${VIDEO_CORRECTION_PRODUCT.priceEuros} €/vídeo · ${total} € total (${count} vídeos)`;
}
