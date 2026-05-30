import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { BlogPost } from "@/content/blog/posts";

export function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <article className="glass-panel group flex flex-col rounded-2xl p-6 transition hover:border-sky-500/40">
      <div className="flex flex-wrap gap-2">
        {post.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-400"
          >
            {tag}
          </span>
        ))}
      </div>
      <h2 className="mt-4 text-xl font-semibold group-hover:text-sky-300">
        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
      </h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-400">
        {post.description}
      </p>
      <p className="mt-4 text-xs text-zinc-500">
        {format(parseISO(post.publishedAt), "d MMMM yyyy", { locale: es })} ·{" "}
        {post.readingMinutes} min lectura
      </p>
      <Link
        href={`/blog/${post.slug}`}
        className="mt-4 text-sm font-medium text-sky-400 hover:underline"
      >
        Leer artículo →
      </Link>
    </article>
  );
}
