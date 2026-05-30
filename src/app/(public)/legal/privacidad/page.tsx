import { LegalDocument } from "@/components/legal/LegalDocument";
import { privacyPolicyDocument } from "@/content/legal/privacy";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Política de privacidad",
  description:
    "Tratamiento de datos personales, derechos RGPD y contacto del responsable en AM Snowboard Coach.",
  path: "/legal/privacidad",
  noIndex: true,
});

export default function PrivacidadPage() {
  return <LegalDocument doc={privacyPolicyDocument} />;
}
