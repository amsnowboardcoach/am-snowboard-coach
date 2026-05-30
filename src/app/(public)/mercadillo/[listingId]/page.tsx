import { MarketplaceListingDetail } from "@/components/marketplace/MarketplaceListingDetail";

type PageProps = {
  params: Promise<{ listingId: string }>;
};

export default async function MercadilloListingPage({ params }: PageProps) {
  const { listingId } = await params;
  return (
    <section className="mx-auto max-w-2xl px-4 py-10 pb-24 sm:py-14">
      <MarketplaceListingDetail listingId={listingId} />
    </section>
  );
}
