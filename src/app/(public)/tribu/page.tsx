import { Suspense } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { TribeFeed } from "@/components/tribe/TribeFeed";
import { TribeFeedSkeleton } from "@/components/tribe/TribeFeedSkeleton";
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
        eyebrow="Comunidad"
        title="La Tribu"
        subtitle="Momentos reales en pista: mira el feed sin cuenta, reacciona, comenta y comparte. Los alumnos suben solo desde su panel."
        imageSrc={heroImage}
        imageAlt="Comunidad de snowboard en Sierra Nevada"
      />

      <section
        id="feed"
        className="page-container max-w-2xl scroll-mt-header page-pad-y-tight pb-12 sm:pb-16 lg:pb-20"
      >
        <Suspense fallback={<TribeFeedSkeleton count={3} />}>
          <TribeFeed />
        </Suspense>
      </section>
    </div>
  );
}
