"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { COACH_ROLES } from "@/constants/roles";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CONDITIONS,
  MARKETPLACE_MODERATION_LABEL,
  formatMarketplacePrice,
  isMarketplaceListingPublic,
} from "@/constants/marketplace";
import { formatFirestoreClientError } from "@/lib/firebase/firestore-errors";
import { formatFirestoreDate } from "@/lib/utils/dates";
import {
  fetchMarketplaceListingById,
  getMarketplaceShareUrl,
  markListingSoldAndRemove,
} from "@/lib/firebase/marketplace-listings";
import type { MarketplaceListing } from "@/types/marketplace";
import { MarketplaceContactActions } from "@/components/marketplace/MarketplaceContactActions";

interface MarketplaceListingDetailProps {
  listingId: string;
}

export function MarketplaceListingDetail({
  listingId,
}: MarketplaceListingDetailProps) {
  const { user, profile } = useAuth();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [markingSold, setMarkingSold] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchMarketplaceListingById(listingId, {
      viewerId: user?.uid,
      viewerIsCoach: Boolean(profile && COACH_ROLES.includes(profile.role)),
    })
      .then(setListing)
      .catch((err) =>
        setError(
          formatFirestoreClientError(err, "No se pudo cargar el anuncio"),
        ),
      )
      .finally(() => setLoading(false));
  }, [listingId, user?.uid, profile?.role]);

  if (loading) {
    return <p className="text-center text-zinc-500">Cargando anuncio…</p>;
  }

  if (error || !listing) {
    return (
      <div className="rounded-xl border border-zinc-800 py-16 text-center">
        <p className="text-zinc-400">
          Este anuncio no existe o ya se vendió y fue retirado.
        </p>
        <Link
          href="/mercadillo"
          className="mt-4 inline-block link-accent underline-offset-2 hover:underline"
        >
          Ir al mercadillo
        </Link>
      </div>
    );
  }

  const isOwner = user?.uid === listing.sellerId;
  const isPublic = isMarketplaceListingPublic(listing);
  const conditionLabel =
    MARKETPLACE_CONDITIONS.find((c) => c.id === listing.condition)?.label;
  const categoryLabel =
    MARKETPLACE_CATEGORIES.find((c) => c.id === listing.category)?.label;

  async function handleMarkSold() {
    if (
      !listing ||
      !user ||
      !confirm("¿Marcar como vendido? El anuncio se eliminará.")
    ) {
      return;
    }
    setMarkingSold(true);
    try {
      await markListingSoldAndRemove(listing.id, user.uid);
      window.location.href = "/mercadillo";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setMarkingSold(false);
    }
  }

  async function handleShare() {
    if (!listing) return;
    const url = getMarketplaceShareUrl(listing.id);
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* cancelado */
    }
  }

  const photo = listing.imageUrls[photoIndex] ?? listing.imageUrls[0];

  return (
    <div className="space-y-4">
      <Link
        href="/mercadillo"
        className="inline-block text-sm link-accent underline-offset-2 hover:underline"
      >
        ← Volver al mercadillo
      </Link>
    <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
      <div className="relative aspect-[4/3] bg-black sm:aspect-video">
        {photo && (
          <Image
            src={photo}
            alt={listing.title}
            fill
            className="object-contain"
            unoptimized
          />
        )}
      </div>
      {listing.imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto border-b border-zinc-800 p-2">
          {listing.imageUrls.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setPhotoIndex(i)}
              className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === photoIndex ? "border-sky-500" : "border-transparent"
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" unoptimized />
            </button>
          ))}
        </div>
      )}

      <div className="p-6">
        <h1 className="text-2xl font-bold text-zinc-100">{listing.title}</h1>
        <p className="mt-2 text-2xl font-bold text-sky-400">
          {formatMarketplacePrice(listing.priceEuros)}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          {categoryLabel} · {conditionLabel} ·{" "}
          {formatFirestoreDate(listing.createdAt)}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
          {listing.description}
        </p>

        {isOwner && !isPublic && (
          <p
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              listing.moderationStatus === "rejected"
                ? "border-red-500/30 bg-red-500/10 text-red-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-200"
            }`}
          >
            {MARKETPLACE_MODERATION_LABEL[listing.moderationStatus ?? "pending"]}
            {listing.moderationStatus === "pending" &&
              " — Alejandro lo revisará antes de que aparezca en el mercadillo."}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleShare()}
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
          >
            Compartir enlace
          </button>
        </div>

        <div className="mt-6 border-t border-zinc-800 pt-6">
          {isOwner ? (
            <>
              <p className="text-sm text-zinc-500">Es tu anuncio</p>
              <button
                type="button"
                onClick={() => void handleMarkSold()}
                disabled={markingSold || !isPublic}
                className="mt-3 w-full rounded-full bg-emerald-500/20 py-3 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
              >
                {markingSold ? "Eliminando…" : "Marcar como vendido"}
              </button>
            </>
          ) : isPublic ? (
            <MarketplaceContactActions listing={listing} />
          ) : null}
        </div>
      </div>
    </article>
    </div>
  );
}
