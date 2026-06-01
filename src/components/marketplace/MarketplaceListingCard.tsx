"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CONDITIONS,
  MARKETPLACE_MODERATION_LABEL,
  isMarketplaceListingPublic,
} from "@/constants/marketplace";
import { formatFirestoreDate } from "@/lib/utils/dates";
import {
  getMarketplaceShareUrl,
  markListingSoldAndRemove,
} from "@/lib/firebase/marketplace-listings";
import type { MarketplaceListing } from "@/types/marketplace";
import { MarketplaceContactActions } from "@/components/marketplace/MarketplaceContactActions";
import { formatMarketplacePrice } from "@/constants/marketplace";

interface MarketplaceListingCardProps {
  listing: MarketplaceListing;
  isOwner?: boolean;
  onSold?: () => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export function MarketplaceListingCard({
  listing,
  isOwner = false,
  onSold,
  expanded = false,
  onToggleExpand,
}: MarketplaceListingCardProps) {
  const [markingSold, setMarkingSold] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareHint, setShareHint] = useState<string | null>(null);

  const conditionLabel =
    MARKETPLACE_CONDITIONS.find((c) => c.id === listing.condition)?.label ??
    listing.condition;
  const categoryLabel =
    MARKETPLACE_CATEGORIES.find((c) => c.id === listing.category)?.label ??
    listing.category;
  const isPublic = isMarketplaceListingPublic(listing);
  const moderationLabel =
    MARKETPLACE_MODERATION_LABEL[listing.moderationStatus ?? "approved"];

  async function handleMarkSold() {
    if (
      !confirm(
        "¿Marcar como vendido? El anuncio se eliminará y dejará de mostrarse.",
      )
    ) {
      return;
    }
    setMarkingSold(true);
    setError(null);
    try {
      await markListingSoldAndRemove(listing.id, listing.sellerId);
      onSold?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo marcar");
    } finally {
      setMarkingSold(false);
    }
  }

  async function handleShare() {
    const url = getMarketplaceShareUrl(listing.id);
    try {
      if (navigator.share) {
        await navigator.share({
          title: listing.title,
          text: `${listing.title} — ${formatMarketplacePrice(listing.priceEuros)}`,
          url,
        });
        setShareHint("Compartido");
      } else {
        await navigator.clipboard.writeText(url);
        setShareHint("Enlace copiado");
      }
    } catch {
      setShareHint(null);
      return;
    }
    setTimeout(() => setShareHint(null), 2000);
  }

  const cover = listing.imageUrls[0];

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
      <Link
        href={`/mercadillo/${listing.id}`}
        className="relative block aspect-[4/3] bg-zinc-950"
      >
        {cover ? (
          <Image
            src={cover}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 320px"
            unoptimized
          />
        ) : (
          <div className="flex size-full items-center justify-center text-zinc-500">
            Sin foto
          </div>
        )}
        {listing.imageUrls.length > 1 && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-zinc-200">
            +{listing.imageUrls.length - 1}
          </span>
        )}
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/mercadillo/${listing.id}`}
              className="font-semibold text-zinc-100 hover:text-sky-300"
            >
              {listing.title}
            </Link>
            <p className="mt-1 text-lg font-bold text-sky-400">
              {formatMarketplacePrice(listing.priceEuros)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {categoryLabel} · {conditionLabel} ·{" "}
              {formatFirestoreDate(listing.createdAt)}
            </p>
            {isOwner && !isPublic && (
              <p
                className={`mt-2 text-xs font-medium ${
                  listing.moderationStatus === "rejected"
                    ? "text-red-300"
                    : "text-amber-400"
                }`}
              >
                {moderationLabel}
              </p>
            )}
          </div>
        </div>

        {expanded && (
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {listing.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="text-xs link-accent underline-offset-2 hover:underline"
            >
              {expanded ? "Menos" : "Ver descripción"}
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleShare()}
            className="text-xs text-zinc-500 hover:text-zinc-300"
          >
            Compartir
          </button>
          {shareHint && (
            <span className="text-xs text-sky-400">{shareHint}</span>
          )}
        </div>

        {isOwner ? (
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <p className="text-xs text-zinc-500">Tu anuncio</p>
            {listing.moderationStatus === "pending" && (
              <p className="mt-1 text-xs text-amber-400/90">
                En revisión por el coach. Aún no es visible en el mercadillo
                público.
              </p>
            )}
            {listing.moderationStatus === "rejected" && (
              <p className="mt-1 text-xs text-red-300/90">
                Este anuncio no se publicó. Puedes crear uno nuevo si lo deseas.
              </p>
            )}
            <button
              type="button"
              onClick={() => void handleMarkSold()}
              disabled={markingSold || !isPublic}
              className="mt-2 w-full rounded-full border border-emerald-500/40 bg-emerald-500/10 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              {markingSold ? "Eliminando…" : "Marcar como vendido"}
            </button>
            {error && (
              <p className="mt-2 text-xs text-red-300" role="alert">
                {error}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 border-t border-zinc-800 pt-4">
            <MarketplaceContactActions listing={listing} compact />
          </div>
        )}
      </div>
    </article>
  );
}
