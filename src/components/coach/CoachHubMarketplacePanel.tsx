"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MarketplaceModerationPanel } from "@/components/coach/MarketplaceModerationPanel";
import { MARKETPLACE_CATEGORIES } from "@/constants/marketplace";
import { formatFirestoreClientError } from "@/lib/firebase/firestore-errors";
import {
  fetchActiveMarketplaceListings,
  getMarketplaceShareUrl,
  removeMarketplaceListing,
  syncLegacyMarketplaceModeration,
} from "@/lib/firebase/marketplace-listings";
import type { MarketplaceListing } from "@/types/marketplace";

function categoryLabel(id: MarketplaceListing["category"]): string {
  return MARKETPLACE_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export function CoachHubMarketplacePanel({
  onPendingChange,
}: {
  onPendingChange?: () => void;
}) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [moderationKey, setModerationKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await syncLegacyMarketplaceModeration();
      setListings(await fetchActiveMarketplaceListings(80));
    } catch (err) {
      setError(
        formatFirestoreClientError(err, "No se pudo cargar el mercadillo"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRemove(listing: MarketplaceListing) {
    const ok = window.confirm(
      `¿Eliminar el anuncio «${listing.title}»? Desaparecerá del mercadillo.`,
    );
    if (!ok) return;
    setRemovingId(listing.id);
    try {
      await removeMarketplaceListing(listing.id);
      await load();
      setModerationKey((k) => k + 1);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "No se pudo eliminar el anuncio",
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-400">
          Aprueba o rechaza anuncios antes de publicarlos. Los contactos (teléfono
          / email) solo los ves tú como coach.
        </p>
        <Link
          href="/mercadillo"
          className="text-sm link-accent"
        >
          Ver mercadillo público →
        </Link>
      </div>

      <MarketplaceModerationPanel
        key={moderationKey}
        hideWhenEmpty={false}
        onModerated={() => {
          void load();
          onPendingChange?.();
        }}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-200">
          Anuncios publicados
        </h2>
        {loading && <p className="text-zinc-500">Cargando anuncios…</p>}
        {error && <p className="text-sm text-red-300">{error}</p>}

        {!loading && !error && listings.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-700 py-12 text-center text-zinc-500">
            No hay anuncios publicados en el mercadillo.
          </p>
        )}

        <ul className="space-y-4">
          {listings.map((listing) => (
            <li
              key={listing.id}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:flex-row"
            >
              {listing.imageUrls[0] && (
                <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-32">
                  <Image
                    src={listing.imageUrls[0]}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="128px"
                    unoptimized
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-zinc-100">{listing.title}</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {listing.sellerDisplayName} ·{" "}
                      {categoryLabel(listing.category)} · {listing.priceEuros} €
                    </p>
                  </div>
                  <p className="text-lg font-bold text-sky-300">
                    {listing.priceEuros} €
                  </p>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                  {listing.description}
                </p>
                {(listing.contactPhone || listing.contactEmail) && (
                  <p className="mt-2 text-xs text-zinc-500">
                    Contacto:{" "}
                    {[listing.contactPhone, listing.contactEmail]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/mercadillo/${listing.id}`}
                    className="rounded-full border border-zinc-700 px-4 py-1.5 text-sm text-zinc-300 hover:border-zinc-500"
                  >
                    Ver en web
                  </Link>
                  <a
                    href={getMarketplaceShareUrl(listing.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-zinc-700 px-4 py-1.5 text-sm text-zinc-300 hover:border-zinc-500"
                  >
                    Enlace directo
                  </a>
                  <button
                    type="button"
                    disabled={removingId === listing.id}
                    onClick={() => void handleRemove(listing)}
                    className="rounded-full border border-red-500/40 px-4 py-1.5 text-sm text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {removingId === listing.id ? "Eliminando…" : "Eliminar anuncio"}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
