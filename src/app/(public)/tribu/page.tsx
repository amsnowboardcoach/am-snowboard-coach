import { Suspense } from "react";
import { PageHeader, PageShell } from "@/components/layout/PageShell";
import { TribeFeed } from "@/components/tribe/TribeFeed";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "La Tribu — comunidad AM Snowboard",
  description:
    "Fotos y vídeos de alumnos en Sierra Nevada. Mira el feed, reacciona, comenta y comparte. Solo alumnos registrados pueden publicar.",
  path: "/tribu",
  keywords: ["snowboard Sierra Nevada comunidad", "La Tribu AM Snowboard"],
});

export default function TribuPage() {
  return (
    <PageShell width="narrow" spacing="default" className="stack-page">
      <PageHeader
        eyebrow="Comunidad"
        title="La Tribu"
        description="Momentos en la nieve: abre el feed sin cuenta, reacciona, comenta y comparte. Solo alumnos registrados pueden subir fotos y vídeos."
      />
      <Suspense
        fallback={
          <p className="text-center text-sm text-zinc-500">
            Cargando La Tribu…
          </p>
        }
      >
        <TribeFeed />
      </Suspense>
    </PageShell>
  );
}
