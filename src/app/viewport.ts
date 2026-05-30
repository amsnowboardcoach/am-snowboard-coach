import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1a2332" },
    { media: "(prefers-color-scheme: dark)", color: "#1a2332" },
  ],
};
