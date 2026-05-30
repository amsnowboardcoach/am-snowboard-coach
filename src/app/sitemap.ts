import type { MetadataRoute } from "next";
import { getAllSlugs } from "@/content/blog/posts";
import { getSiteUrl } from "@/lib/seo/site";

const PUBLIC_PATHS = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/clases", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/tarifas", changeFrequency: "monthly" as const, priority: 0.9 },
  { path: "/sobre-mi", changeFrequency: "monthly" as const, priority: 0.8 },
  { path: "/reservar", changeFrequency: "weekly" as const, priority: 0.95 },
  { path: "/tribu", changeFrequency: "daily" as const, priority: 0.75 },
  { path: "/mercadillo", changeFrequency: "daily" as const, priority: 0.8 },
  { path: "/legal/terminos", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/legal/privacidad", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/legal/cookies", changeFrequency: "yearly" as const, priority: 0.2 },
  { path: "/blog", changeFrequency: "weekly" as const, priority: 0.85 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  const staticEntries = PUBLIC_PATHS.map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const blogEntries = getAllSlugs().map((slug) => ({
    url: `${base}/blog/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...blogEntries];
}
