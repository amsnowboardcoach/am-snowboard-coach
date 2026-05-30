import { LegalDocument } from "@/components/legal/LegalDocument";
import { cookiePolicyDocument } from "@/content/legal/cookies";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Política de cookies",
  description:
    "Uso de cookies y almacenamiento local en AM Snowboard Coach (LSSI y RGPD).",
  path: "/legal/cookies",
  noIndex: true,
});

export default function CookiesPage() {
  return <LegalDocument doc={cookiePolicyDocument} />;
}
