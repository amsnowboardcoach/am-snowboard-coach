import type { Metadata } from "next";
import { BRAND_ICON_OG } from "@/constants/brand-icons";
import {
  DEFAULT_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  getSiteUrl,
} from "@/lib/seo/site";

const siteUrl = getSiteUrl();

export type PageSeoInput = {
  title: string;
  description?: string;
  path?: string;
  keywords?: string[];
  ogImage?: string;
  noIndex?: boolean;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

export function buildPageMetadata(input: PageSeoInput): Metadata {
  const description = input.description ?? DEFAULT_DESCRIPTION;
  const url = input.path ? `${siteUrl}${input.path}` : siteUrl;
  const ogImage = input.ogImage ?? `${siteUrl}/icon.svg`;

  return {
    title: input.title,
    description,
    keywords: [...SITE_KEYWORDS, ...(input.keywords ?? [])],
    alternates: {
      canonical: url,
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
    openGraph: {
      type: input.type ?? "website",
      locale: "es_ES",
      url,
      siteName: SITE_NAME,
      title: `${input.title} | ${SITE_NAME}`,
      description,
      images: [
        {
          url: ogImage,
          width: 512,
          height: 512,
          alt: SITE_NAME,
        },
      ],
      ...(input.publishedTime
        ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} | ${SITE_NAME}`,
      description,
      images: [ogImage],
    },
  };
}

export const rootMetadata: Metadata = {
  metadataBase: new URL(siteUrl),
  ...buildPageMetadata({
    title: "Clases de snowboard en Sierra Nevada · Granada",
    path: "/",
  }),
  title: {
    default: `${SITE_NAME} | Clases en Sierra Nevada`,
    template: `%s | ${SITE_NAME}`,
  },
};
