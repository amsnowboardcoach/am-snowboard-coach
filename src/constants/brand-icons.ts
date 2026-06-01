/** Rutas del logo de marca (mismo diseño que la PWA) */
export const BRAND_ICON_32 = "/icons/icon-32.png";
export const BRAND_ICON_144 = "/icons/icon-144.png";
export const BRAND_ICON_180 = "/icons/icon-180.png";
export const BRAND_ICON_192 = "/icons/icon-192.png";
export const BRAND_ICON_512 = "/icons/icon-512.png";

/** Redes sociales y SEO por defecto */
export const BRAND_ICON_OG = BRAND_ICON_512;

export const BRAND_ICON_MANIFEST = [
  { src: BRAND_ICON_144, sizes: "144x144", type: "image/png", purpose: "any" },
  { src: BRAND_ICON_180, sizes: "180x180", type: "image/png", purpose: "any" },
  { src: BRAND_ICON_192, sizes: "192x192", type: "image/png", purpose: "any" },
  { src: BRAND_ICON_512, sizes: "512x512", type: "image/png", purpose: "any" },
  {
    src: "/icons/icon-512-maskable.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
] as const;
