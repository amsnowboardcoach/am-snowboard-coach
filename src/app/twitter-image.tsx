import { ImageResponse } from "next/og";
import { brandOgMarkup } from "@/lib/brand/icon-markup";

export const alt = "AM Snowboard Coach — clases en Sierra Nevada";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(brandOgMarkup(), { ...size });
}
