import Image from "next/image";
import Link from "next/link";
import { reservarHref } from "@/lib/booking/reservar-url";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { VideoCorrectionCard } from "@/components/products/VideoCorrectionCard";
import { LESSON_TYPES, lessonPublicName } from "@/constants/lesson-types";
import { getAllPosts } from "@/content/blog/posts";
import { HomeHeroBookingSection } from "@/components/home/HomeHeroBookingSection";
import { PageHero } from "@/components/layout/PageHero";
import { SectionHeading } from "@/components/layout/SectionHeading";
import { TribeFeedPreview } from "@/components/tribe/TribeFeedPreview";
import { LessonTypeCardMedia } from "@/components/lessons/LessonTypeCardMedia";
import { getSiteMedia } from "@/lib/pexels/site-media";

/** Regenerar tras cambiar fotos de tarjetas (evita HTML en caché con Pexels) */
export const revalidate = 60;

export default async function HomePage() {
  const media = await getSiteMedia();
  const latestPosts = getAllPosts().slice(0, 3);

  return (
    <div>
      <PageHero
        tall
        title="Aprende snowboard con método, en Sierra Nevada"
        subtitle="De tu primera bajada al freestyle en Snowpark Sulayr: clases claras, seguimiento real y comunidad."
        imageSrc={media.hero.image.src}
        imageAlt={media.hero.image.alt}
        videoSrc={media.hero.video?.src}
        videoPoster={media.hero.video?.poster}
        afterSubtitle={<HomeHeroBookingSection />}
      />

      <section className="band-section">
        <div className="page-container">
          <SectionHeading
            centered
            title="Tipos de clase"
            subtitle="Iniciación, carving o freestyle. Duración y turno los eliges al reservar."
          />
          <div className="mt-10 grid gap-grid sm:mt-12 md:grid-cols-3">
            {LESSON_TYPES.map((lesson, i) => (
              <article
                key={lesson.id}
                className="glass-panel group overflow-hidden rounded-2xl transition duration-300 hover:border-sky-500/40"
              >
                <div className="relative aspect-[16/10] max-h-44 overflow-hidden sm:max-h-48">
                  <LessonTypeCardMedia lessonId={lesson.id} priority={i === 0} />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                </div>
                <div className="p-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-sky-400">
                    {lessonPublicName(lesson)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                    {lesson.description}
                  </p>
                  <Link
                    href={reservarHref({ estilo: lesson.id })}
                    className="mt-4 inline-flex text-sm font-medium text-sky-400 transition hover:text-sky-300"
                  >
                    Reservar {lessonPublicName(lesson).toLowerCase()} →
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

      <section className="page-container pb-6 sm:pb-8">
        <VideoCorrectionCard />
      </section>

      <TribeFeedPreview
        title="Ambiente en la nieve"
        subtitle="Fotos y vídeos de la comunidad. Reacciona, comenta y comparte."
        maxPosts={4}
      />

      <section className="page-container py-12 sm:py-20">
        <SectionHeading
          title="Guías y consejos en pista"
          subtitle="Guías sobre iniciación, carving, Snowpark Sulayr, tarifas y cómo reservar tu clase."
        />
        <div className="mt-10 grid gap-grid sm:mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {latestPosts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
        <p className="mt-8 text-center">
          <Link href="/blog" className="link-accent underline-offset-2 hover:underline">
            Ver todos los artículos →
          </Link>
        </p>
      </section>

      <section className="relative overflow-hidden section-pad lg:py-24">
        <Image
          src={media.reservar.image.src}
          alt=""
          fill
          className="object-cover opacity-30"
          sizes="100vw"
        />
        <div className="page-container relative max-w-3xl text-center">
          <h2 className="page-title">¿Tu próxima sesión en la nieve?</h2>
          <p className="page-lead mt-0 text-zinc-300">
            Reserva en la web o por WhatsApp. Te confirmo por email; pagas con tarjeta o lo acordamos al aceptar tu plaza.
          </p>
          <Link
            href="/reservar"
            className="btn-primary-lg mt-8"
          >
            Reservar ahora
          </Link>
        </div>
      </section>
    </div>
  );
}
