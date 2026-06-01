"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { formatFirestoreClientError } from "@/lib/firebase/firestore-errors";
import {
  fetchActiveMarketplaceListings,
  fetchMyActiveListings,
} from "@/lib/firebase/marketplace-listings";
import type { MarketplaceListing } from "@/types/marketplace";
import { MarketplaceListingCard } from "@/components/marketplace/MarketplaceListingCard";
import { MarketplaceCreateForm } from "@/components/marketplace/MarketplaceCreateForm";
import { cn } from "@/lib/utils/cn";

type Tab = "explorar" | "publicar" | "mis";

const tabs: { id: Tab; label: string }[] = [
  { id: "explorar", label: "Explorar" },
  { id: "publicar", label: "Publicar" },
  { id: "mis", label: "Mis anuncios" },
];

export function MarketplaceHub() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("explorar");
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myError, setMyError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadExplore = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setListings(await fetchActiveMarketplaceListings());
    } catch (err) {
      setError(
        formatFirestoreClientError(err, "No se pudo cargar el mercadillo"),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMine = useCallback(async () => {
    if (!user?.uid || user.isAnonymous) {
      setMyListings([]);
      setMyError(null);
      return;
    }
    setMyError(null);
    try {
      setMyListings(await fetchMyActiveListings(user.uid));
    } catch (err) {
      setMyListings([]);
      setMyError(
        formatFirestoreClientError(err, "No se pudieron cargar tus anuncios"),
      );
    }
  }, [user?.uid, user?.isAnonymous]);

  useEffect(() => {
    void loadExplore();
  }, [loadExplore]);

  useEffect(() => {
    if (!authLoading) void loadMine();
  }, [authLoading, loadMine]);

  function refreshAll() {
    void loadExplore();
    void loadMine();
  }

  function handleCreated() {
    refreshAll();
    setTab("mis");
  }

  return (
    <div className="stack-page">
      <nav
        className="grid grid-cols-3 gap-2 rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-2"
        aria-label="Secciones del mercadillo"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-11 touch-manipulation rounded-full px-2 text-sm font-medium transition",
              tab === t.id
                ? "bg-sky-500 text-zinc-950"
                : "text-zinc-400 hover:text-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "publicar" && (
        <MarketplaceCreateForm onCreated={handleCreated} />
      )}

      {tab === "mis" && (
        <section>
          {!user || user.isAnonymous ? (
            <p className="text-center text-sm text-zinc-500">
              Inicia sesión para ver tus anuncios activos.
            </p>
          ) : myError ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {myError}
            </p>
          ) : myListings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-700 py-12 text-center text-sm text-zinc-500">
              No tienes anuncios activos. Cuando vendas uno, desaparecerá de
              aquí automáticamente.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {myListings.map((listing) => (
                <MarketplaceListingCard
                  key={listing.id}
                  listing={listing}
                  isOwner
                  onSold={refreshAll}
                  expanded={expandedId === listing.id}
                  onToggleExpand={() =>
                    setExpandedId((id) =>
                      id === listing.id ? null : listing.id,
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "explorar" && (
        <section>
          {loading && (
            <p className="text-center text-sm text-zinc-500">Cargando…</p>
          )}
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}
          {!loading && !error && listings.length === 0 && (
            <p className="rounded-xl border border-dashed border-zinc-700 py-16 text-center text-zinc-500">
              Aún no hay anuncios. Sé el primero en publicar material de
              snowboard.
            </p>
          )}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <MarketplaceListingCard
                key={listing.id}
                listing={listing}
                isOwner={user?.uid === listing.sellerId}
                onSold={refreshAll}
                expanded={expandedId === listing.id}
                onToggleExpand={() =>
                  setExpandedId((id) =>
                    id === listing.id ? null : listing.id,
                  )
                }
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
