import { MarketplaceHub } from "@/components/marketplace/MarketplaceHub";
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
    <section className="mx-auto max-w-6xl px-4 py-10 pb-24 sm:py-14 sm:pb-20">
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-400/90">
        Comunidad
      </p>
      <h1 className="mt-2 text-3xl font-bold">Mercadillo</h1>
      <p className="mt-3 max-w-2xl text-zinc-400">
        Tipo Wallapop para la comunidad AM: tablas, botas, ropa y accesorios.
        Explora sin cuenta; para publicar regístrate. Al marcar como vendido, el
        anuncio se elimina automáticamente.
      </p>
      <div className="mt-10">
        <MarketplaceHub />
      </div>
    </section>
  );
}
