import Image from "next/image";
import Link from "next/link";
import { CookieBanner } from "@/components/legal/CookieBanner";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SkipToContent } from "@/components/layout/SkipToContent";
import { getSiteMedia } from "@/lib/pexels/site-media";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const media = await getSiteMedia();

  return (
    <div className="site-mesh flex min-h-dvh flex-col">
      <SkipToContent />
      <SiteHeader />
      <SiteChrome />
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="relative hidden min-h-[280px] flex-1 lg:block">
          {media.hero.video?.src ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              poster={media.hero.video.poster}
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src={media.hero.video.src} type="video/mp4" />
            </video>
          ) : (
            <Image
              src={media.hero.image.src}
              alt={media.hero.image.alt}
              fill
              className="object-cover"
              sizes="50vw"
              priority
            />
          )}
          <div className="absolute inset-0 bg-zinc-950/50" />
          <div className="absolute bottom-10 left-10 right-10">
            <p className="text-sm uppercase tracking-widest text-sky-400">
              Área privada
            </p>
            <p className="mt-2 max-w-md text-2xl font-bold leading-snug">
              Tu pasaporte de trucos, vídeos y comunidad en un solo sitio.
            </p>
          </div>
        </div>
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-wrap gap-4 text-sm lg:hidden">
              <Link
                href="/"
                className="text-zinc-500 transition hover:text-zinc-300"
              >
                ← Inicio
              </Link>
              <Link
                href="/reservar"
                className="text-sky-400 transition hover:text-sky-300"
              >
                Reservar clase
              </Link>
              <Link
                href="/clases"
                className="text-zinc-500 transition hover:text-zinc-300"
              >
                Clases
              </Link>
            </div>
            {children}
          </div>
        </main>
      </div>
      <CookieBanner />
    </div>
  );
}
