import { ImageResponse } from "next/og";
import { brandIconSquareMarkup } from "@/lib/brand/icon-markup";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(brandIconSquareMarkup(180), { ...size });
}
