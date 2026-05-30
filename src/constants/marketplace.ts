import type { MarketplaceCategory, MarketplaceCondition } from "@/types/marketplace";

export const MARKETPLACE_MAX_IMAGES = 5;
export const MARKETPLACE_MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const MARKETPLACE_CONDITIONS: {
  id: MarketplaceCondition;
  label: string;
}[] = [
  { id: "new", label: "Nuevo" },
  { id: "like_new", label: "Como nuevo" },
  { id: "used", label: "Usado" },
];

export const MARKETPLACE_CATEGORIES: {
  id: MarketplaceCategory;
  label: string;
}[] = [
  { id: "tabla", label: "Tabla" },
  { id: "fijaciones", label: "Fijaciones" },
  { id: "botas", label: "Botas" },
  { id: "ropa", label: "Ropa" },
  { id: "cascos", label: "Cascos / protección" },
  { id: "mochilas", label: "Mochilas" },
  { id: "accesorios", label: "Accesorios" },
  { id: "otros", label: "Otros" },
];

export const MARKETPLACE_DISCLAIMER =
  "El mercadillo conecta a miembros de la comunidad. Las ventas son entre particulares; AM Snowboard Coach no gestiona pagos ni envíos. Al marcar como vendido, el anuncio desaparece del listado.";

export function formatMarketplacePrice(euros: number): string {
  return `${euros.toLocaleString("es-ES")} €`;
}

export function marketplaceWhatsAppUrl(
  phoneDigits: string,
  title: string,
): string {
  const digits = phoneDigits.replace(/\D/g, "");
  const text = `Hola, me interesa tu anuncio en AM Snowboard Coach: ${title}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function normalizeMarketplacePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("34")) return digits;
  if (digits.length === 9) return `34${digits}`;
  return digits;
}
