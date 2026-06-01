import { BRAND_ICON_512 } from "@/constants/brand-icons";
import { COACH_EMAIL, BOOKING_LOCATION } from "@/constants/project";
import {
  COACH_NAME,
  LOCALITY,
  REGION,
  SITE_NAME,
  getSiteUrl,
} from "@/lib/seo/site";

type JsonLdProps = {
  data: Record<string, unknown>;
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function localBusinessJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: SITE_NAME,
    description:
      "Clases de snowboard en Sierra Nevada con monitor certificado. Iniciación, carving y freestyle.",
    url,
    image: `${url}/icon.svg`,
    email: COACH_EMAIL,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Granada",
      addressRegion: "Andalucía",
      addressCountry: "ES",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 37.0944,
      longitude: -3.3988,
    },
    areaServed: {
      "@type": "Place",
      name: "Sierra Nevada, España",
    },
    priceRange: "€€",
    sport: "Snowboard",
    employee: {
      "@type": "Person",
      name: COACH_NAME,
      jobTitle: "Head Coach de snowboard",
    },
    potentialAction: {
      "@type": "ReserveAction",
      target: `${url}/reservar`,
      name: "Reservar clase de snowboard",
    },
    location: BOOKING_LOCATION,
  };
}

export function blogPostingJsonLd(post: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  modifiedAt?: string;
}) {
  const url = getSiteUrl();
  const postUrl = `${url}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt ?? post.publishedAt,
    author: {
      "@type": "Person",
      name: COACH_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${url}${BRAND_ICON_512}`,
      },
    },
    mainEntityOfPage: postUrl,
    url: postUrl,
    inLanguage: "es-ES",
    about: ["Snowboard", "Sierra Nevada", LOCALITY, REGION],
  };
}

export function blogIndexJsonLd(postCount: number) {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `Blog ${SITE_NAME}`,
    description: "Consejos, técnica y novedades sobre snowboard en Sierra Nevada.",
    url: `${url}/blog`,
    inLanguage: "es-ES",
    blogPost: `${url}/blog`,
    numberOfPosts: postCount,
  };
}
