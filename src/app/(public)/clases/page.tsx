import Image from "next/image";
import Link from "next/link";
import { LESSON_TYPES, lessonPublicName } from "@/constants/lesson-types";
import {
  BOOKING_ADVISORY,
  BOOKING_MEETING_POINT,
  BOOKING_NOT_INCLUDED,
} from "@/constants/booking-info";
import {
  RECOMMENDED_SESSION_DURATION_ID,
  SESSION_DURATIONS,
  formatExtraParticipantsNote,
  sessionTotalEuros,
} from "@/constants/session-schedules";
import { ClasesBookingSteps } from "@/components/clases/ClasesBookingSteps";
import { VideoCorrectionCard } from "@/components/products/VideoCorrectionCard";
import { PageHero } from "@/components/layout/PageHero";
import { TribeFeedPreview } from "@/components/tribe/TribeFeedPreview";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { LessonTypeCardMedia } from "@/components/lessons/LessonTypeCardMedia";
import { getSiteMedia } from "@/lib/pexels/site-media";

export const revalidate = 60;
import { reservarHref } from "@/lib/booking/reservar-url";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils/cn";
import type { LessonTypeId } from "@/constants/lesson-types";

export const metadata = buildPageMetadata({
  title: "Tipos de clase de snowboard",
  description:
    "Iniciación, carving y freestyle en Sierra Nevada. Clases de 2 h, 3 h o día completo. Reserva online con calendario en vivo.",
  path: "/clases",
  keywords: ["clases snowboard iniciación", "carving Sierra Nevada", "freestyle Snowpark Sulayr"],
});

const LESSON_HIGHLIGHTS: Record<LessonTypeId, string[]> = {
  iniciacion: [
    "Postura, equilibrio y primeros giros",
    "Frenado seguro",
    "Confianza desde la primera bajada",
  ],
  carving: [
    "Uso de cantos y giros cerrados",
    "Velocidad y control en pistas azules y rojas",
    "Técnica progresiva según tu nivel",
  ],
  "freestyle-sulayr": [
    "Líneas y saltos en Snowpark Sulayr",
    "Rails y boxes con progresión segura",
    "Snowpark de Sierra Nevada",
  ],
};

export default async function ClasesPage() {
  const media = await getSiteMedia();

  return (
    <div>
      <PageHero
        eyebrow="Metodología AM"
        title="Clases de snowboard en Sierra Nevada"
        subtitle="Iniciación, carving o freestyle. Reserva en la web (señal 30% o pago total con tarjeta) o por WhatsApp."
        imageSrc={media.clase.image.src}
        imageAlt={media.clase.image.alt}
      >
        <Link href={reservarHref()} className="btn-primary-lg">
          Reservar clase en pista
        </Link>
        <Link href="#estilos" className="btn-outline min-h-12 px-6 py-3.5">
          Ver estilos
        </Link>
        <Link href="/tarifas" className="btn-outline min-h-12 px-6 py-3.5">
          Tarifas
        </Link>
      </PageHero>

      <section className="page-container section-pad-tight">
        <SectionHeading
          centered
          title="Cómo reservar"
          subtitle="Sin llamadas: disponibilidad real, precio claro y solicitud en minutos."
        />
        <ClasesBookingSteps className="mt-10" />
      </section>

      <section
        id="estilos"
        className="scroll-mt-header band-section"
      >
        <div className="page-container">
          <SectionHeading
            title="Estilos de clase"
            subtitle="Elige el enfoque del día; la duración y el turno los marcas al reservar."
          />
          <div className="mt-10 grid gap-grid md:grid-cols-3 sm:mt-12">
            {LESSON_TYPES.map((lesson) => (
              <article
                key={lesson.id}
                className="glass-panel group flex flex-col overflow-hidden rounded-2xl transition duration-300 hover:border-sky-500/35"
              >
                <div className="relative h-44 overflow-hidden sm:h-48">
                  <LessonTypeCardMedia lessonId={lesson.id} />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-xl font-semibold text-sky-400">
                    {lessonPublicName(lesson)}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
                    {lesson.description}
                  </p>
                  <ul className="mt-4 space-y-1.5 text-sm text-zinc-500">
                    {LESSON_HIGHLIGHTS[lesson.id].map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-sky-500/80" aria-hidden>
                          ·
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={reservarHref({ estilo: lesson.id })}
                    className="btn-warm-soft mt-5 w-full py-2.5"
                  >
                    {lesson.id === "freestyle-sulayr"
                      ? "Reservar en Sulayr"
                      : `Reservar ${lesson.name.toLowerCase()}`}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="duraciones" className="page-container scroll-mt-header section-pad">
        <SectionHeading
          title="Duración y turnos"
          subtitle="Los huecos libres salen del calendario al reservar."
        />
        <ul className="mt-10 grid gap-5 lg:grid-cols-3">
          {SESSION_DURATIONS.map((session) => {
            const featured = session.id === RECOMMENDED_SESSION_DURATION_ID;
            return (
            <li
              key={session.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6",
                featured
                  ? "panel-selected pt-8"
                  : "border-zinc-800 bg-zinc-900/40",
              )}
            >
              {featured && (
                <span className="featured-badge absolute -top-3 left-1/2 -translate-x-1/2">
                  Recomendado
                </span>
              )}
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                En pista
              </p>
              <h3 className="mt-1 text-lg font-semibold text-zinc-100">
                {session.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {session.description}
              </p>
              <p className="mt-4 text-3xl font-bold text-sky-400">
                {sessionTotalEuros(session)} €
                <span className="ml-1 text-base font-normal text-zinc-500">
                  / día · 1 persona
                </span>
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {formatExtraParticipantsNote(session)}
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Turnos
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {session.slots.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full border border-zinc-700 bg-zinc-950/60 px-2.5 py-0.5 text-xs text-zinc-300"
                  >
                    {s.label}
                  </span>
                ))}
              </div>
              <Link
                href={reservarHref({ duracion: session.id })}
                className={
                  featured ? "btn-card-cta-featured py-2.5" : "btn-card-cta py-2.5"
                }
              >
                Reservar {session.shortLabel}
              </Link>
            </li>
            );
          })}
        </ul>

        <div className="mt-10 glass-panel rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-zinc-100">
            Varios días en la misma reserva
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            En la reserva elige uno o varios días en el calendario con el mismo
            turno. El precio se calcula por día según personas y duración.
          </p>
          <Link
            href={reservarHref()}
            className="mt-5 inline-flex text-sm font-medium link-accent"
          >
            Elegir días en el calendario →
          </Link>
        </div>
      </section>

      <section className="page-container pb-12 sm:pb-16 lg:pb-20">
        <div className="grid gap-grid md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h3 className="font-semibold text-zinc-100">Punto de encuentro</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {BOOKING_MEETING_POINT} (Sierra Nevada).
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <h3 className="font-semibold text-zinc-100">Qué incluye</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {BOOKING_NOT_INCLUDED} {BOOKING_ADVISORY}
            </p>
          </div>
        </div>

        <VideoCorrectionCard className="mt-10" />

        <TribeFeedPreview
          className="mt-12"
          title="La Tribu"
          subtitle="Fotos y vídeos de la comunidad. Reacciona, comenta y comparte."
          maxPosts={4}
        />

        <div className="mt-14 rounded-2xl border border-sky-500/25 bg-sky-500/10 px-6 py-10 text-center sm:px-10">
          <h2 className="text-balance text-2xl font-semibold text-zinc-50">
            ¿Listo para tu sesión en pista?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-400">
            Abre el calendario, marca día y turno libres y envía la solicitud.
            Reserva con señal del 30% o pago total en la web; te confirmo por email.
          </p>
          <div className="btn-row-center mt-6">
            <Link href={reservarHref()} className="btn-primary-lg">
              Reservar ahora
            </Link>
            <Link
              href="/tarifas"
              className="btn-outline"
            >
              Ver tarifas detalladas
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
