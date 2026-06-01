import type { MetadataRoute } from "next";
import { ROBOTS_DISALLOW } from "@/lib/seo/crawl";
import { getSiteUrl } from "@/lib/seo/site";

const disallow = [...ROBOTS_DISALLOW];

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
