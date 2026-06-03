import Link from "next/link";
import { BlogPostCard } from "@/components/blog/BlogPostCard";
import { PageHero } from "@/components/layout/PageHero";
import { getAllPosts } from "@/content/blog/posts";
import { blogIndexJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getSiteMedia } from "@/lib/pexels/site-media";

export const metadata = buildPageMetadata({
  title: "Blog de snowboard en Sierra Nevada",
  description:
    "Consejos, técnica, tarifas y temporada en Sierra Nevada y Snowpark Sulayr. Artículos del monitor Alejandro Martín (AM Snowboard Coach).",
  path: "/blog",
  keywords: [
    "blog snowboard Sierra Nevada",
    "consejos snowboard Granada",
    "técnica carving freestyle",
  ],
});

export default async function BlogIndexPage() {
  const posts = getAllPosts();
  const media = await getSiteMedia();

  return (
    <div>
      <JsonLd data={blogIndexJsonLd(posts.length)} />
      <PageHero
        eyebrow="Blog"
        title="Snowboard en Sierra Nevada"
        subtitle="Consejos de técnica, Snowpark Sulayr, tarifas y temporada: todo para planificar tu clase en Sierra Nevada."
        imageSrc={media.sierra.image.src}
        imageAlt={media.sierra.image.alt}
      />

      <section className="page-container section-pad">
        <div className="grid gap-grid sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>

        <div className="glass-panel mt-16 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold">¿Listo para la pista?</h2>
          <p className="mt-2 text-zinc-400">
            Reserva tu turno en el calendario del coach y recibe confirmación por email.
          </p>
          <Link
            href="/reservar"
            className="btn-primary-lg mt-6"
          >
            Reservar clase
          </Link>
        </div>
      </section>
    </div>
  );
}
