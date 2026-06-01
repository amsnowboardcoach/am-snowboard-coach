import type { MetadataRoute } from "next";
import { buildSitemapEntries } from "@/lib/seo/crawl";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemapEntries();
}
