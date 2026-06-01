import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthProvider";
import { PwaShell } from "@/components/pwa/PwaShell";
import {
  BRAND_ICON_180,
  BRAND_ICON_192,
  BRAND_ICON_32,
  BRAND_ICON_512,
} from "@/constants/brand-icons";
import { rootMetadata } from "@/lib/seo/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  ...rootMetadata,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent" as const,
    title: "AM Coach",
  },
  applicationName: "AM Coach",
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: BRAND_ICON_32, type: "image/png", sizes: "32x32" },
      { url: BRAND_ICON_192, type: "image/png", sizes: "192x192" },
      { url: BRAND_ICON_512, type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: BRAND_ICON_180, type: "image/png", sizes: "180x180" }],
    shortcut: BRAND_ICON_192,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col bg-zinc-950 text-zinc-50">
        <AuthProvider>
          {children}
          <PwaShell />
        </AuthProvider>
      </body>
    </html>
  );
}
