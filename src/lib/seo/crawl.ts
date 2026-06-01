import { getAllPosts } from "@/content/blog/posts";
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";

/** Rutas que no deben indexarse (área privada, APIs, pagos). */
export const ROBOTS_DISALLOW = [
  "/api/",
  "/_next/",
  "/coach",
  "/coach/",
  "/perfil",
  "/perfil/",
  "/login",
  "/registro",
  "/pagar/",
] as const;

export type SitemapStaticRoute = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

/** Páginas públicas indexables (sin textos de UI; solo URLs para el sitemap). */
export const SITEMAP_STATIC_ROUTES: SitemapStaticRoute[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/reservar", changeFrequency: "weekly", priority: 0.95 },
  { path: "/clases", changeFrequency: "monthly", priority: 0.9 },
  { path: "/tarifas", changeFrequency: "monthly", priority: 0.9 },
  { path: "/sobre-mi", changeFrequency: "monthly", priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.85 },
  { path: "/mercadillo", changeFrequency: "daily", priority: 0.8 },
  { path: "/tribu", changeFrequency: "daily", priority: 0.75 },
  { path: "/legal/terminos", changeFrequency: "yearly", priority: 0.2 },
  { path: "/legal/privacidad", changeFrequency: "yearly", priority: 0.2 },
  { path: "/legal/cookies", changeFrequency: "yearly", priority: 0.2 },
];

export function buildSitemapEntries(): MetadataRoute.Sitemap {
  const base = getSiteUrl();

  const staticEntries: MetadataRoute.Sitemap = SITEMAP_STATIC_ROUTES.map(
    ({ path, changeFrequency, priority }) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    }),
  );

  const blogEntries: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt ?? post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries];
}
