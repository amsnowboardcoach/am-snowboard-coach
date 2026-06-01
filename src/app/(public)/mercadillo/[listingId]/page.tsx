import { PageShell } from "@/components/layout/PageShell";
import { MarketplaceListingDetail } from "@/components/marketplace/MarketplaceListingDetail";

type PageProps = {
  params: Promise<{ listingId: string }>;
};

export default async function MercadilloListingPage({ params }: PageProps) {
  const { listingId } = await params;
  return (
    <PageShell width="detail" spacing="default">
      <MarketplaceListingDetail listingId={listingId} />
    </PageShell>
  );
}
