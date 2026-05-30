import Image from "next/image";
import Link from "next/link";
import { reservarHref } from "@/lib/booking/reservar-url";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { VideoCorrectionCard } from "@/components/products/VideoCorrectionCard";
import { LESSON_TYPES } from "@/constants/lesson-types";
import { getAllPosts } from "@/content/blog/posts";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { TribePhotoGrid } from "@/components/tribe/TribePhotoGrid";
import { getSiteMedia } from "@/lib/pexels/site-media";

export default async function HomePage() {
  const media = await getSiteMedia();
  const latestPosts = getAllPosts().slice(0, 3);

  return (
    <div>
      <PageHero
        tall
        eyebrow="Sierra Nevada · Granada"
        title="Aprende snowboard con método, en Sierra Nevada"
        subtitle="Alejandro Martín, Head Coach con más de 7.500 horas en pista. De tu primera bajada al freestyle en Sulayr: clases claras, seguimiento real y comunidad AM."
        imageSrc={media.hero.image.src}
        imageAlt={media.hero.image.alt}
        videoSrc={media.hero.video?.src}
        videoPoster={media.hero.video?.poster}
      >
        <Link
          href="/reservar"
          className="flex min-h-12 w-full items-center justify-center rounded-full bg-sky-500 px-8 py-3.5 text-center font-semibold text-zinc-950 shadow-xl shadow-sky-500/25 transition active:bg-sky-400 sm:w-auto"
        >
          Reservar mi clase
        </Link>
        <Link
          href="/clases"
          className="flex min-h-12 w-full items-center justify-center rounded-full border border-white/25 bg-white/10 px-8 py-3.5 text-center font-semibold text-white backdrop-blur transition active:bg-white/15 sm:w-auto"
        >
          Ver tipos de clase
        </Link>
      </PageHero>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src={media.pista.image.src}
              alt={media.pista.image.alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
          <div>
            <SectionHeading
              title="En pista, a tu ritmo"
              subtitle="Turnos de mañana y tarde en horario diurno (peninsular). Reserva en dos minutos, confirmación personal y tu espacio de alumno para seguir progresando."
            />
            <ul className="mt-8 space-y-4 text-zinc-300">
              <li className="flex gap-3">
                <span className="text-sky-400">✓</span>
                Calendario en tiempo real: elige día y turno libre
              </li>
              <li className="flex gap-3">
                <span className="text-sky-400">✓</span>
                Pasaporte de trucos y corrección de vídeo con apuntes del coach
              </li>
              <li className="flex gap-3">
                <span className="text-sky-400">✓</span>
                Instala la web en el móvil y recibe avisos al confirmar tu clase
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-800/80 bg-zinc-900/30 py-12 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading
            centered
            title="Tipos de clase"
            subtitle="Iniciación, carving o freestyle. Duración y turno los eliges al reservar."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {LESSON_TYPES.map((lesson, i) => (
              <article
                key={lesson.id}
                className="glass-panel group overflow-hidden rounded-2xl transition duration-300 hover:border-sky-500/40"
              >
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={media.lessonCards[i]?.src ?? media.clase.image.src}
                    alt={lesson.name}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-sky-400">
                    {lesson.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {lesson.description}
                  </p>
                  <Link
                    href={reservarHref({ estilo: lesson.id })}
                    className="mt-4 inline-flex text-sm font-medium text-sky-400 transition hover:text-sky-300"
                  >
                    Reservar {lesson.name.toLowerCase()} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/tarifas"
              className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm text-zinc-300 transition hover:border-sky-500/40 hover:text-white"
            >
              Ver tarifas
            </Link>
            <Link
              href="/tribu"
              className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm text-zinc-300 transition hover:border-sky-500/40 hover:text-white"
            >
              La Tribu
            </Link>
            <Link
              href="/mercadillo"
              className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm text-zinc-300 transition hover:border-sky-500/40 hover:text-white"
            >
              Mercadillo
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8">
        <VideoCorrectionCard />
      </section>

      <TribePhotoGrid />

      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        <SectionHeading
          title="Guías y consejos en pista"
          subtitle="Guías sobre iniciación, carving, Sulayr, tarifas y cómo reservar tu clase."
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {latestPosts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link href="/blog" className="text-sky-400 hover:underline">
            Ver todos los artículos →
          </Link>
        </p>
      </section>

      <section className="relative overflow-hidden py-12 sm:py-24">
        <Image
          src={media.reservar.image.src}
          alt=""
          fill
          className="object-cover opacity-30"
          sizes="100vw"
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold">¿Tu próxima sesión en la nieve?</h2>
          <p className="mt-4 text-zinc-300">
            Reserva en la web o por WhatsApp. Te confirmo por email; pagas con tarjeta o lo acordamos al aceptar tu plaza.
          </p>
          <Link
            href="/reservar"
            className="mt-8 inline-flex rounded-full bg-sky-500 px-10 py-3.5 font-semibold text-zinc-950 hover:bg-sky-400"
          >
            Reservar ahora
          </Link>
        </div>
      </section>
    </div>
  );
}
