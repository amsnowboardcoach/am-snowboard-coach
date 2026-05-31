import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthProvider";
import { PwaShell } from "@/components/pwa/PwaShell";
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
  icons: {
    icon: [
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" }],
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
