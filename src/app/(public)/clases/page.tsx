import Image from "next/image";
import Link from "next/link";
import { LESSON_TYPES } from "@/constants/lesson-types";
import { MAX_BOOKING_DAYS } from "@/constants/booking-plan";
import {
  BOOKING_ADVISORY,
  BOOKING_MEETING_POINT,
  BOOKING_NOT_INCLUDED,
} from "@/constants/booking-info";
import {
  SESSION_DURATIONS,
  formatExtraParticipantsNote,
  formatSessionPrice,
  sessionTotalEuros,
} from "@/constants/session-schedules";
import { ClasesBookingSteps } from "@/components/clases/ClasesBookingSteps";
import { VideoCorrectionCard } from "@/components/products/VideoCorrectionCard";
import { PageHero } from "@/components/layout/PageHero";
import { TribeVideoStrip } from "@/components/tribe/TribeVideoStrip";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { getSiteMedia } from "@/lib/pexels/site-media";
import { reservarHref } from "@/lib/booking/reservar-url";
import { buildPageMetadata } from "@/lib/seo/metadata";
import type { LessonTypeId } from "@/constants/lesson-types";

export const metadata = buildPageMetadata({
  title: "Tipos de clase de snowboard",
  description:
    "Iniciación, carving y freestyle en Sierra Nevada. Clases de 2 h, 3 h o día completo. Reserva online con calendario en vivo.",
  path: "/clases",
  keywords: ["clases snowboard iniciación", "carving Sierra Nevada", "freestyle Sulayr"],
});

const LESSON_HIGHLIGHTS: Record<LessonTypeId, string[]> = {
  iniciacion: [
    "Postura, equilibrio y primeros giros",
    "Frenado seguro en cuchilla",
    "Confianza desde la primera bajada",
  ],
  carving: [
    "Uso de cantos y giros cerrados",
    "Velocidad con control en azul y rojo",
    "Técnica progresiva según tu nivel",
  ],
  "freestyle-sulayr": [
    "Líneas y saltos en Sulayr",
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
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={reservarHref()}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-sky-500 px-8 py-3.5 font-semibold text-zinc-950 shadow-xl shadow-sky-500/25 transition hover:bg-sky-400"
          >
            Reservar clase en pista
          </Link>
          <Link
            href="#estilos"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-600 px-6 py-3.5 text-sm font-medium text-zinc-200 transition hover:border-sky-500/50 hover:text-white"
          >
            Ver estilos
          </Link>
          <Link
            href="/tarifas"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-600 px-6 py-3.5 text-sm font-medium text-zinc-200 transition hover:border-sky-500/50 hover:text-white"
          >
            Tarifas
          </Link>
        </div>
      </PageHero>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <SectionHeading
          centered
          title="Cómo reservar"
          subtitle="Sin llamadas: disponibilidad real, precio claro y solicitud en minutos."
        />
        <ClasesBookingSteps className="mt-10" />
      </section>

      <section
        id="estilos"
        className="scroll-mt-header border-y border-zinc-800/80 bg-zinc-900/30 py-12 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            title="Estilos de clase"
            subtitle="Elige el enfoque del día; la duración y el turno los marcas al reservar."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {LESSON_TYPES.map((lesson, i) => (
              <article
                key={lesson.id}
                className="glass-panel group flex flex-col overflow-hidden rounded-2xl transition duration-300 hover:border-sky-500/35"
              >
                <div className="relative h-44 overflow-hidden sm:h-48">
                  <Image
                    src={media.lessonCards[i]?.src ?? media.clase.image.src}
                    alt={lesson.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-xl font-semibold text-sky-400">
                    {lesson.name}
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
                    className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-sky-500/15 py-2.5 text-sm font-semibold text-sky-200 ring-1 ring-sky-500/30 transition hover:bg-sky-500 hover:text-zinc-950"
                  >
                    Reservar {lesson.name.toLowerCase()}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="duraciones" className="scroll-mt-header mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <SectionHeading
          title="Duración y turnos"
          subtitle="Los huecos libres salen del calendario al reservar."
        />
        <ul className="mt-10 grid gap-5 lg:grid-cols-3">
          {SESSION_DURATIONS.map((session) => (
            <li
              key={session.id}
              className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
            >
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
              <p className="text-xs text-zinc-500">{formatSessionPrice(session)}</p>
              <p className="mt-1 text-xs text-zinc-600">
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
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-sky-500 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400"
              >
                Reservar {session.shortLabel}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 glass-panel rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-semibold text-zinc-100">
            Varios días en la misma reserva
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            En la reserva toca uno o varios días en el calendario (hasta{" "}
            {MAX_BOOKING_DAYS}) con el mismo turno. El precio se calcula por día
            según personas y duración.
          </p>
          <Link
            href={reservarHref()}
            className="mt-5 inline-flex text-sm font-medium text-sky-400 hover:text-sky-300"
          >
            Elegir días en el calendario →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:pb-16">
        <div className="grid gap-6 md:grid-cols-2">
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

        <div className="mt-12">
          <TribeVideoStrip title="Vídeos de la comunidad" />
        </div>

        <div className="mt-14 rounded-2xl border border-sky-500/25 bg-sky-500/10 px-6 py-10 text-center sm:px-10">
          <h2 className="text-balance text-2xl font-semibold text-zinc-50">
            ¿Listo para tu sesión en pista?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-400">
            Abre el calendario, marca día y turno libres y envía la solicitud.
            Reserva con señal del 30% o pago total en la web; te confirmo por email.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={reservarHref()}
              className="inline-flex rounded-full bg-sky-500 px-10 py-3.5 font-semibold text-zinc-950 shadow-lg shadow-sky-500/20 hover:bg-sky-400"
            >
              Reservar ahora
            </Link>
            <Link
              href="/tarifas"
              className="inline-flex rounded-full border border-zinc-600 px-6 py-3 text-sm font-medium text-zinc-200 hover:border-sky-500/40"
            >
              Ver tarifas detalladas
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
