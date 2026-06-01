import Image from "next/image";
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
              Área de alumno
            </p>
            <p className="mt-2 max-w-md text-2xl font-bold leading-snug">
              Entra o regístrate: pasaporte, vídeos y reservas en un solo sitio.
            </p>
          </div>
        </div>
        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
          <div className="w-full max-w-md stack-section">
            {children}
          </div>
        </main>
      </div>
      <CookieBanner />
    </div>
  );
}
