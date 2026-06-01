import Link from "next/link";
import { Suspense } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { TribeFeed } from "@/components/tribe/TribeFeed";
import { TribeFeedSkeleton } from "@/components/tribe/TribeFeedSkeleton";
import { TribeHowItWorks } from "@/components/tribe/TribeHowItWorks";
import { getSiteMedia } from "@/lib/pexels/site-media";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "La Tribu — comunidad AM Snowboard",
  description:
    "Fotos y vídeos de alumnos en Sierra Nevada. Mira el feed, reacciona, comenta y comparte. Solo alumnos registrados pueden publicar.",
  path: "/tribu",
  keywords: ["snowboard Sierra Nevada comunidad", "La Tribu AM Snowboard"],
});

export default async function TribuPage() {
  const media = await getSiteMedia();
  const heroImage =
    media.gallery[0]?.src ??
    media.sierra.image.src;

  return (
    <div>
      <PageHero
        eyebrow="Comunidad AM"
        title="La Tribu"
        subtitle="Momentos reales en pista: mira el feed sin cuenta, reacciona, comenta y comparte. Los alumnos suben solo desde su panel (Perfil → La Tribu)."
        imageSrc={heroImage}
        imageAlt="Comunidad de snowboard en Sierra Nevada"
      >
        <Link
          href="/login"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-sky-500 px-8 py-3.5 font-semibold text-zinc-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-400"
        >
          Área de alumno
        </Link>
        <a
          href="#feed"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-500/80 px-6 py-3.5 text-sm font-medium text-zinc-100 transition hover:border-sky-400/60 hover:text-white"
        >
          Ver feed
        </a>
      </PageHero>

      <section className="page-container page-pad-y-tight">
        <TribeHowItWorks />
      </section>

      <section
        id="feed"
        className="page-container max-w-2xl scroll-mt-header pb-12 sm:pb-16 lg:pb-20"
      >
        <Suspense fallback={<TribeFeedSkeleton count={3} />}>
          <TribeFeed />
        </Suspense>
      </section>
    </div>
  );
}
