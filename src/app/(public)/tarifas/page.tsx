import Link from "next/link";
import { CoachWhatsAppCard } from "@/components/contact/CoachWhatsAppCard";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { VideoCorrectionCard } from "@/components/products/VideoCorrectionCard";
import {
  BOOKING_ADVISORY,
  BOOKING_MEETING_POINT,
  BOOKING_NOT_INCLUDED,
} from "@/constants/booking-info";
import {
  BOOKING_BALANCE_ON_CLASS_DAY,
  BOOKING_DEPOSIT_PERCENT,
} from "@/constants/booking-payment";
import { MAX_BOOKING_DAYS } from "@/constants/booking-plan";
import {
  SESSION_DURATIONS,
  formatExtraParticipantsNote,
  formatSessionPrice,
  sessionTotalEuros,
  type SessionDuration,
} from "@/constants/session-schedules";
import { reservarHref } from "@/lib/booking/reservar-url";
import { getSiteMedia } from "@/lib/pexels/site-media";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils/cn";

export const metadata = buildPageMetadata({
  title: "Tarifas clases snowboard Sierra Nevada",
  description:
    "Precios de clases de snowboard en Sierra Nevada: 2 h, 3 h o día completo. Reserva con señal del 30% o pago total con tarjeta.",
  path: "/tarifas",
  keywords: ["precio clase snowboard Granada", "tarifas monitor Sierra Nevada"],
});

const FEATURED_DURATION_ID = "3h" as const;

function depositEuros(total: number): number {
  return Math.round((total * BOOKING_DEPOSIT_PERCENT) / 100);
}

function PricingCard({
  session,
  featured,
}: {
  session: SessionDuration;
  featured?: boolean;
}) {
  const total = sessionTotalEuros(session);
  const deposit = depositEuros(total);
  const balance = total - deposit;

  return (
    <li
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 transition duration-300 sm:p-7",
        featured
          ? "border-sky-500/45 bg-gradient-to-b from-sky-500/15 to-zinc-900/50 shadow-lg shadow-sky-500/10"
          : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700",
      )}
    >
      {featured && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sky-500 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-950">
          Recomendado
        </span>
      )}
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {session.shortLabel} en pista
      </p>
      <h2 className="mt-1 text-xl font-semibold text-zinc-50">{session.name}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
        {session.description}
      </p>

      <div className="mt-6">
        <p className="text-4xl font-bold tracking-tight text-sky-300">
          {total}
          <span className="ml-1 text-lg font-medium text-zinc-500">€</span>
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          1 persona · {formatSessionPrice(session)}
        </p>
        <p className="mt-2 text-xs text-zinc-600">
          {formatExtraParticipantsNote(session)}
        </p>
      </div>

      <div className="mt-5 rounded-xl border border-zinc-800/80 bg-zinc-950/50 px-3 py-3 text-sm">
        <p className="text-zinc-400">
          Señal{" "}
          <span className="font-semibold text-sky-300">{deposit} €</span>{" "}
          <span className="text-zinc-600">({BOOKING_DEPOSIT_PERCENT}%)</span>
        </p>
        <p className="mt-1 text-zinc-500">
          Resto en pista:{" "}
          <span className="text-zinc-300">{balance} €</span>{" "}
          <span className="text-zinc-600">({BOOKING_BALANCE_ON_CLASS_DAY})</span>
        </p>
        <p className="mt-2 text-[11px] text-zinc-600">
          O pago del 100% con tarjeta al reservar.
        </p>
      </div>

      <p className="mt-5 text-xs font-medium uppercase tracking-wide text-zinc-500">
        Turnos
      </p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {session.slots.map((slot) => (
          <li
            key={slot.id}
            className="rounded-full border border-zinc-700/80 bg-zinc-950/60 px-2.5 py-0.5 text-xs text-zinc-300"
          >
            {slot.label}
          </li>
        ))}
      </ul>

      <Link
        href={reservarHref({ duracion: session.id })}
        className={cn(
          "mt-6 inline-flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold transition",
          featured
            ? "bg-sky-500 text-zinc-950 hover:bg-sky-400"
            : "bg-sky-500/15 text-sky-200 ring-1 ring-sky-500/35 hover:bg-sky-500 hover:text-zinc-950",
        )}
      >
        Reservar {session.shortLabel}
      </Link>
    </li>
  );
}

export default async function TarifasPage() {
  const media = await getSiteMedia();

  return (
    <div>
      <PageHero
        eyebrow="Sierra Nevada"
        title="Tarifas claras, sin sorpresas"
        subtitle="El precio depende de la duración y las personas en pista. Reserva en la web con calendario en vivo: señal del 30% o pago total con tarjeta."
        imageSrc={media.sierra.image.src}
        imageAlt={media.sierra.image.alt}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={reservarHref()}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-sky-500 px-8 py-3.5 font-semibold text-zinc-950 shadow-xl shadow-sky-500/25 transition hover:bg-sky-400"
          >
            Ver calendario y reservar
          </Link>
          <Link
            href="/clases"
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-zinc-600 px-6 py-3.5 text-sm font-medium text-zinc-200 transition hover:border-sky-500/50 hover:text-white"
          >
            Estilos de clase
          </Link>
        </div>
      </PageHero>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <SectionHeading
          centered
          title="Precios por duración"
          subtitle="Horario peninsular. El importe final se calcula al reservar según días y participantes."
        />
        <ul className="mt-10 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {SESSION_DURATIONS.map((session) => (
            <PricingCard
              key={session.id}
              session={session}
              featured={session.id === FEATURED_DURATION_ID}
            />
          ))}
        </ul>
      </section>

      <section className="border-y border-zinc-800/80 bg-zinc-900/30 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            centered
            title="Cómo pagar al reservar"
            subtitle="Alejandro confirma tu plaza por email. El calendario muestra los huecos reales antes de pagar."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <article className="glass-panel rounded-2xl p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-sky-400/90">
                Opción habitual
              </p>
              <h3 className="mt-2 text-lg font-semibold text-zinc-100">
                Señal del {BOOKING_DEPOSIT_PERCENT}% con tarjeta
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Pagas la señal al enviar la solicitud (Stripe). El resto lo
                abonas {BOOKING_BALANCE_ON_CLASS_DAY} cuando nos veamos en
                pista.
              </p>
            </article>
            <article className="glass-panel rounded-2xl p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Sin pendiente en pista
              </p>
              <h3 className="mt-2 text-lg font-semibold text-zinc-100">
                Pago completo con tarjeta
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Si prefieres dejarlo cerrado, puedes pagar el 100% en el momento
                de la reserva. Nada más que coordinar el día de la clase.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass-panel rounded-2xl p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-zinc-100">
              Varios días, mismo proceso
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              En la reserva puedes elegir hasta {MAX_BOOKING_DAYS} días en el
              calendario. Si no hay el mismo turno libre todos los días, eliges
              el horario disponible de cada fecha. El total se calcula
              automáticamente.
            </p>
            <Link
              href={reservarHref()}
              className="mt-5 inline-flex text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              Abrir calendario de reserva →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="text-sm font-semibold text-zinc-200">
                Punto de encuentro
              </h3>
              <p className="mt-2 text-sm text-zinc-400">{BOOKING_MEETING_POINT}</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <h3 className="text-sm font-semibold text-zinc-200">
                Qué no incluye
              </h3>
              <p className="mt-2 text-sm text-zinc-400">
                {BOOKING_NOT_INCLUDED} {BOOKING_ADVISORY}
              </p>
            </div>
          </div>
        </div>

        <VideoCorrectionCard className="mt-10" />

        <CoachWhatsAppCard
          className="mt-8"
          intro="¿Dudas sobre precio, grupo grande o fechas? Escríbeme y lo vemos antes de reservar."
        />

        <div className="mt-14 rounded-2xl border border-sky-500/25 bg-sky-500/10 px-6 py-10 text-center sm:px-10">
          <h2 className="text-balance text-2xl font-semibold text-zinc-50">
            ¿Tienes ya día y turno en mente?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-zinc-400">
            Comprueba disponibilidad en el calendario, elige señal o pago total,
            y recibirás confirmación por email.
          </p>
          <Link
            href={reservarHref()}
            className="mt-6 inline-flex rounded-full bg-sky-500 px-10 py-3.5 font-semibold text-zinc-950 shadow-lg shadow-sky-500/20 transition hover:bg-sky-400"
          >
            Reservar mi clase
          </Link>
        </div>
      </section>
    </div>
  );
}
