"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MARKETPLACE_CATEGORIES } from "@/constants/marketplace";
import { formatFirestoreClientError } from "@/lib/firebase/firestore-errors";
import {
  fetchPendingMarketplaceListings,
  setMarketplaceListingModeration,
} from "@/lib/firebase/marketplace-listings";
import type { MarketplaceListing } from "@/types/marketplace";

interface MarketplaceModerationPanelProps {
  hideWhenEmpty?: boolean;
  onModerated?: () => void;
}

function categoryLabel(id: MarketplaceListing["category"]): string {
  return MARKETPLACE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function MarketplaceModerationPanel({
  hideWhenEmpty = true,
  onModerated,
}: MarketplaceModerationPanelProps) {
  const [pending, setPending] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPending(await fetchPendingMarketplaceListings(30));
    } catch (err) {
      setPending([]);
      setError(
        formatFirestoreClientError(
          err,
          "No se pudieron cargar los anuncios pendientes",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(
    listingId: string,
    status: "approved" | "rejected",
  ) {
    setActingId(listingId);
    setActionError(null);
    try {
      await setMarketplaceListingModeration(listingId, status);
      await load();
      onModerated?.();
    } catch (err) {
      setActionError(
        formatFirestoreClientError(err, "No se pudo actualizar el anuncio"),
      );
    } finally {
      setActingId(null);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-zinc-500">Cargando anuncios pendientes…</p>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </p>
    );
  }

  if (pending.length === 0) {
    if (hideWhenEmpty) return null;
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 py-12 text-center text-zinc-500">
        No hay anuncios pendientes de moderación.
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
      <h2 className="text-lg font-semibold text-amber-200">
        Anuncios pendientes ({pending.length})
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        Aprueba para publicar en el mercadillo. Rechazar oculta el anuncio sin
        avisar al vendedor por la app.
      </p>
      {actionError && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {actionError}
        </p>
      )}
      <ul className="mt-6 space-y-6">
        {pending.map((listing) => (
          <li
            key={listing.id}
            className="flex flex-col gap-4 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 sm:flex-row"
          >
            {listing.imageUrls[0] && (
              <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg sm:h-28 sm:w-36">
                <Image
                  src={listing.imageUrls[0]}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="144px"
                  unoptimized
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-100">{listing.title}</p>
              <p className="mt-1 text-sm text-zinc-500">
                {listing.sellerDisplayName} · {categoryLabel(listing.category)}{" "}
                · {listing.priceEuros} €
              </p>
              <p className="mt-2 line-clamp-3 text-sm text-zinc-400">
                {listing.description}
              </p>
              {(listing.contactPhone || listing.contactEmail) && (
                <p className="mt-2 text-xs text-zinc-600">
                  Contacto:{" "}
                  {[listing.contactPhone, listing.contactEmail]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={actingId === listing.id}
                  onClick={() => void setStatus(listing.id, "approved")}
                  className="rounded-full bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  disabled={actingId === listing.id}
                  onClick={() => void setStatus(listing.id, "rejected")}
                  className="rounded-full bg-zinc-800 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
                >
                  Rechazar
                </button>
                <Link
                  href={`/mercadillo/${listing.id}`}
                  className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200"
                >
                  Vista previa
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
