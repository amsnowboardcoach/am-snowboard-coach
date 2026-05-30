"use client";

import {
  formatMarketplacePrice,
  marketplaceWhatsAppUrl,
  normalizeMarketplacePhone,
} from "@/constants/marketplace";
import type { MarketplaceListing } from "@/types/marketplace";

interface MarketplaceContactActionsProps {
  listing: MarketplaceListing;
  compact?: boolean;
}

export function MarketplaceContactActions({
  listing,
  compact = false,
}: MarketplaceContactActionsProps) {
  const phone = listing.contactPhone?.trim();
  const email = listing.contactEmail?.trim();
  const digits = phone ? normalizeMarketplacePhone(phone) : "";

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p className="text-lg font-bold text-sky-300">
        {formatMarketplacePrice(listing.priceEuros)}
      </p>
      <p className="text-sm text-zinc-500">
        Vendedor:{" "}
        <span className="text-zinc-300">{listing.sellerDisplayName}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {digits.length >= 9 && (
          <a
            href={marketplaceWhatsAppUrl(digits, listing.title)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-full bg-[#25D366] px-5 text-sm font-semibold text-white hover:opacity-90"
          >
            WhatsApp
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(`Mercadillo AM: ${listing.title}`)}`}
            className="inline-flex min-h-11 items-center rounded-full border border-zinc-600 px-5 text-sm font-medium text-zinc-200 hover:border-sky-500/50"
          >
            Email
          </a>
        )}
      </div>
    </div>
  );
}
