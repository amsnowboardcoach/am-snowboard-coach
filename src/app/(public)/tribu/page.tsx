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
    <section className="mx-auto max-w-lg px-4 py-10 pb-24 sm:py-14 sm:pb-20">
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-400/90">
        Comunidad
      </p>
      <h1 className="mt-2 text-3xl font-bold">La Tribu</h1>
      <p className="mt-3 text-zinc-400">
        Momentos en la nieve: abre el feed sin cuenta, reacciona, comenta y
        comparte. Solo alumnos registrados pueden subir fotos y vídeos.
      </p>
      <div className="mt-10">
        <TribeFeed />
      </div>
    </section>
  );
}
