import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { notFound } from "next/navigation";
import { BlogPostContent } from "@/components/blog/BlogPostContent";
import {
  getAllSlugs,
  getPostBySlug,
} from "@/content/blog/posts";
import { blogPostingJsonLd, breadcrumbJsonLd, JsonLd } from "@/lib/seo/json-ld";
import { buildPageMetadata } from "@/lib/seo/metadata";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return buildPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: post.tags,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt ?? post.publishedAt,
  });
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const dateLabel = format(parseISO(post.publishedAt), "d MMMM yyyy", {
    locale: es,
  });

  return (
    <article className="content-align-start page-container max-w-3xl page-pad-y stack-page">
      <JsonLd
        data={blogPostingJsonLd({
          title: post.title,
          description: post.description,
          slug: post.slug,
          publishedAt: post.publishedAt,
          modifiedAt: post.updatedAt,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ])}
      />

      <header>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-zinc-400">{post.description}</p>
        <p className="mt-4 text-sm text-zinc-500">
          {dateLabel} · {post.readingMinutes} min lectura · Alejandro Martín
        </p>
      </header>

      <div className="mt-10 border-t border-zinc-800 pt-10">
        <BlogPostContent body={post.body} />
      </div>

      <footer className="glass-panel mt-12 rounded-2xl p-6">
        <p className="font-semibold">¿Te ha sido útil?</p>
        <p className="mt-2 text-sm text-zinc-400">
          Reserva tu próxima sesión en Sierra Nevada con confirmación personal del
          coach.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href="/reservar"
            className="btn-primary-md"
          >
            Reservar clase
          </Link>
          <Link
            href="/tarifas"
            className="rounded-full border border-zinc-700 px-6 py-2.5 text-sm text-zinc-300 hover:border-sky-500/50"
          >
            Ver tarifas
          </Link>
        </div>
      </footer>
    </article>
  );
}
