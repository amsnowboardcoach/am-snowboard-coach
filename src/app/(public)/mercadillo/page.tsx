import { MarketplaceHub } from "@/components/marketplace/MarketplaceHub";
import { PageHeader, PageShell } from "@/components/layout/PageShell";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Mercadillo snowboard — segunda mano Sierra Nevada",
  description:
    "Compra y vende material de snowboard usado o nuevo entre la comunidad AM. Contacta por WhatsApp o email. Los anuncios vendidos desaparecen solos.",
  path: "/mercadillo",
  keywords: [
    "mercadillo snowboard",
    "material snowboard segunda mano",
    "Sierra Nevada",
  ],
});

export default function MercadilloPage() {
  return (
    <PageShell spacing="default" className="stack-page">
      <PageHeader
        eyebrow="Comunidad"
        title="Mercadillo"
        description="Tipo Wallapop para la comunidad AM: tablas, botas, ropa y accesorios. Explora sin cuenta; para publicar regístrate. Al marcar como vendido, el anuncio se elimina automáticamente."
      />
      <MarketplaceHub />
    </PageShell>
  );
}
