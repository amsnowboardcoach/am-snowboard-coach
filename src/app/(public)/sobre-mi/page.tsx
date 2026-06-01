import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { getSiteMedia } from "@/lib/pexels/site-media";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Alejandro Martín — monitor snowboard",
  description:
    "Alejandro Martín, monitor de snowboard en Sierra Nevada con más de 7.500 horas en pista. Método AM: técnica, pasaporte de trucos y comunidad.",
  path: "/sobre-mi",
  keywords: ["Alejandro Martín snowboard", "monitor Sierra Nevada Granada"],
});

export default async function SobreMiPage() {
  const media = await getSiteMedia();

  return (
    <div>
      <PageHero
        eyebrow="Head Coach"
        title="Alejandro Martín"
        subtitle="Fundador de AM Snowboard Coach · 15 temporadas en Sierra Nevada y Snowpark Sulayr"
        imageSrc={media.coach.image.src}
        imageAlt={media.coach.image.alt}
      />

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_340px]">
          <div className="space-y-6 text-lg leading-relaxed text-zinc-300">
            <p>
              Más de <strong className="text-zinc-100">7.500 horas</strong> de
              clase en pista con alumnos de todos los niveles. Desde la primera
              bajada hasta líneas en Snowpark Sulayr con criterio y seguridad.
            </p>
            <p>
              Combino técnica clara, Pasaporte de Trucos para ver tu progreso y La
              Tribu para compartir la experiencia con otros riders. Cada sesión
              tiene un objetivo concreto.
            </p>
            <p>
              Reviso yo cada solicitud de reserva: te confirmo la plaza por email y,
              si todo encaja, te envío el enlace de pago antes de subir a la
              telesilla.
            </p>
            <Link
              href="/reservar"
              className="inline-flex rounded-full bg-sky-500 px-8 py-3 font-semibold text-zinc-950 hover:bg-sky-400"
            >
              Reservar una clase
            </Link>
          </div>
          <div className="space-y-4">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
              <Image
                src={media.pista.image.src}
                alt={media.pista.image.alt}
                fill
                className="object-cover"
                sizes="340px"
              />
            </div>
            <div className="glass-panel rounded-2xl p-5 text-sm text-zinc-400">
              <p className="font-medium text-zinc-200">Sierra Nevada</p>
              <p className="mt-1">Sierra Nevada · Granada · Horario diurno</p>
              <p className="mt-4 font-medium text-zinc-200">Contacto</p>
              <p className="mt-1">
                <a
                  href="mailto:amsnowboardcoach@gmail.com"
                  className="text-sky-400 hover:underline"
                >
                  amsnowboardcoach@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
