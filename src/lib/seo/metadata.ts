import type { Metadata } from "next";
import {
  COACH_NAME,
  DEFAULT_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  getSiteUrl,
} from "@/lib/seo/site";

const siteUrl = getSiteUrl();
const defaultOgImage = `${siteUrl}/opengraph-image`;
const defaultTwitterImage = `${siteUrl}/twitter-image`;

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

function googleSiteVerification(): Metadata["verification"] | undefined {
  const token = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  return token ? { google: token } : undefined;
}

export function buildPageMetadata(input: PageSeoInput): Metadata {
  const description = input.description ?? DEFAULT_DESCRIPTION;
  const url = input.path ? `${siteUrl}${input.path}` : siteUrl;
  const ogImage = input.ogImage ?? defaultOgImage;
  const twitterImage = input.ogImage ?? defaultTwitterImage;
  const verification = googleSiteVerification();

  return {
    title: input.title,
    description,
    keywords: [...SITE_KEYWORDS, ...(input.keywords ?? [])],
    authors: [{ name: COACH_NAME, url: siteUrl }],
    creator: COACH_NAME,
    publisher: SITE_NAME,
    category: "sports",
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },
    alternates: {
      canonical: url,
      languages: {
        "es-ES": url,
      },
    },
    robots: input.noIndex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    ...(verification ? { verification } : {}),
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
          width: 1200,
          height: 630,
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
      images: [twitterImage],
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
