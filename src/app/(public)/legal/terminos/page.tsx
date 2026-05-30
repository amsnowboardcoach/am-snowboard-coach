import { LegalDocument } from "@/components/legal/LegalDocument";
import { termsOfUseDocument } from "@/content/legal/terms";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Términos de uso y aviso legal",
  description:
    "Condiciones de uso, aviso legal LSSI y responsabilidades del sitio AM Snowboard Coach.",
  path: "/legal/terminos",
  noIndex: true,
});

export default function TerminosPage() {
  return <LegalDocument doc={termsOfUseDocument} />;
}
