import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref } from "firebase/storage";
import { MARKETPLACE_MAX_IMAGE_BYTES, MARKETPLACE_MAX_IMAGES } from "@/constants/marketplace";
import { formatFirestoreClientError } from "@/lib/firebase/firestore-errors";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase/client";
import {
  mapStorageUploadError,
  uploadUserFile,
} from "@/lib/firebase/storage-upload";
import { isMarketplaceListingPublic } from "@/constants/marketplace";
import type {
  MarketplaceCategory,
  MarketplaceCondition,
  MarketplaceListing,
  MarketplaceModerationStatus,
} from "@/types/marketplace";

function mapListing(
  id: string,
  data: Record<string, unknown>,
): MarketplaceListing {
  const listing = { id, ...data } as MarketplaceListing;
  if (!listing.moderationStatus) {
    listing.moderationStatus = "approved";
  }
  return listing;
}

const LISTINGS = "marketplace_listings";

function listingsCol() {
  return collection(getFirebaseDb(), LISTINGS);
}

function listingRef(id: string) {
  return doc(getFirebaseDb(), LISTINGS, id);
}

export function validateMarketplaceImages(files: File[]): string | null {
  if (files.length < 1) return "Añade al menos una foto del artículo.";
  if (files.length > MARKETPLACE_MAX_IMAGES) {
    return `Máximo ${MARKETPLACE_MAX_IMAGES} fotos.`;
  }
  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return "Solo imágenes (JPG, PNG o WebP).";
    }
    if (file.size > MARKETPLACE_MAX_IMAGE_BYTES) {
      return "Cada foto puede pesar hasta 10 MB.";
    }
  }
  return null;
}

export async function createMarketplaceListing(input: {
  sellerId: string;
  sellerDisplayName: string;
  sellerPhotoURL?: string;
  title: string;
  description: string;
  priceEuros: number;
  condition: MarketplaceCondition;
  category: MarketplaceCategory;
  contactPhone?: string;
  contactEmail?: string;
  imageFiles: File[];
}): Promise<string> {
  const title = input.title.trim();
  const description = input.description.trim();
  if (title.length < 3 || title.length > 80) {
    throw new Error("El título debe tener entre 3 y 80 caracteres.");
  }
  if (description.length < 10 || description.length > 2000) {
    throw new Error("La descripción debe tener entre 10 y 2000 caracteres.");
  }
  const priceEuros = Math.round(input.priceEuros);
  if (!Number.isFinite(priceEuros) || priceEuros < 1 || priceEuros > 99_999) {
    throw new Error("Indica un precio válido entre 1 y 99 999 €.");
  }
  if (!input.contactPhone?.trim() && !input.contactEmail?.trim()) {
    throw new Error("Indica teléfono o email para que te contacten.");
  }

  const imgErr = validateMarketplaceImages(input.imageFiles);
  if (imgErr) throw new Error(imgErr);

  const refDoc = doc(listingsCol());
  const imageUrls: string[] = [];
  const storagePaths: string[] = [];

  for (let i = 0; i < input.imageFiles.length; i++) {
    const file = input.imageFiles[i];
    const safeName = file.name.replace(/[^\w.\-() ]/g, "_").slice(0, 80);
    const storagePath = `marketplace/${refDoc.id}/${i}-${safeName}`;
    const storageRef = ref(getFirebaseStorage(), storagePath);
    try {
      await uploadUserFile(storageRef, file);
    } catch (err) {
      throw new Error(mapStorageUploadError(err));
    }
    imageUrls.push(await getDownloadURL(storageRef));
    storagePaths.push(storagePath);
  }

  try {
    await setDoc(refDoc, {
      sellerId: input.sellerId,
      sellerDisplayName: input.sellerDisplayName.trim() || "Usuario AM",
      ...(input.sellerPhotoURL ? { sellerPhotoURL: input.sellerPhotoURL } : {}),
      title,
      description,
      priceEuros,
      condition: input.condition,
      category: input.category,
      imageUrls,
      storagePaths,
      contactPhone: input.contactPhone?.trim() || null,
      contactEmail: input.contactEmail?.trim().toLowerCase() || null,
      status: "active",
      moderationStatus: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    for (const storagePath of storagePaths) {
      try {
        await deleteObject(ref(getFirebaseStorage(), storagePath));
      } catch {
        /* ya borrado */
      }
    }
    throw new Error(
      formatFirestoreClientError(err, "No se pudo publicar el anuncio."),
    );
  }

  return refDoc.id;
}

export async function fetchActiveMarketplaceListings(
  max = 48,
): Promise<MarketplaceListing[]> {
  const q = query(
    listingsCol(),
    where("status", "==", "active"),
    where("moderationStatus", "==", "approved"),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => mapListing(d.id, d.data() as Record<string, unknown>))
    .filter(isMarketplaceListingPublic);
}

export async function fetchPendingMarketplaceListings(
  max = 30,
): Promise<MarketplaceListing[]> {
  const q = query(
    listingsCol(),
    where("moderationStatus", "==", "pending"),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    mapListing(d.id, d.data() as Record<string, unknown>),
  );
}

export async function setMarketplaceListingModeration(
  listingId: string,
  moderationStatus: Extract<MarketplaceModerationStatus, "approved" | "rejected">,
): Promise<void> {
  await updateDoc(listingRef(listingId), {
    moderationStatus,
    updatedAt: serverTimestamp(),
  });
}

/** Anuncios activos sin moderationStatus (antes de la moderación). Solo coach. */
export async function syncLegacyMarketplaceModeration(): Promise<number> {
  const q = query(
    listingsCol(),
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
    limit(80),
  );
  const snap = await getDocs(q);
  let updated = 0;
  for (const d of snap.docs) {
    if (d.data().moderationStatus) continue;
    await updateDoc(d.ref, {
      moderationStatus: "approved",
      updatedAt: serverTimestamp(),
    });
    updated += 1;
  }
  return updated;
}

export async function fetchMarketplaceListingById(
  listingId: string,
  options?: { viewerId?: string; viewerIsCoach?: boolean },
): Promise<MarketplaceListing | null> {
  const snap = await getDoc(listingRef(listingId));
  if (!snap.exists()) return null;
  const listing = mapListing(
    snap.id,
    snap.data() as Record<string, unknown>,
  );
  if (listing.status !== "active") return null;
  if (isMarketplaceListingPublic(listing)) return listing;
  if (options?.viewerIsCoach) return listing;
  if (options?.viewerId && listing.sellerId === options.viewerId) {
    return listing;
  }
  return null;
}

export async function fetchMyActiveListings(
  sellerId: string,
): Promise<MarketplaceListing[]> {
  const q = query(
    listingsCol(),
    where("sellerId", "==", sellerId),
    where("status", "==", "active"),
    orderBy("createdAt", "desc"),
    limit(30),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) =>
    mapListing(d.id, d.data() as Record<string, unknown>),
  );
}

/** Marca vendido y elimina el anuncio (desaparece del mercadillo). */
export async function markListingSoldAndRemove(
  listingId: string,
  sellerId: string,
): Promise<void> {
  const snap = await getDoc(listingRef(listingId));
  if (!snap.exists()) throw new Error("Anuncio no encontrado.");
  const data = snap.data();
  if (data.sellerId !== sellerId) {
    throw new Error("No puedes modificar este anuncio.");
  }
  if (data.status !== "active") {
    throw new Error("Este anuncio ya no está activo.");
  }
  const moderationStatus = data.moderationStatus as
    | MarketplaceModerationStatus
    | undefined;
  if (moderationStatus && moderationStatus !== "approved") {
    throw new Error("El anuncio debe estar publicado antes de marcarlo como vendido.");
  }

  const paths = (data.storagePaths as string[] | undefined) ?? [];
  for (const storagePath of paths) {
    try {
      await deleteObject(ref(getFirebaseStorage(), storagePath));
    } catch {
      /* archivo ya borrado */
    }
  }

  await deleteDoc(listingRef(listingId));
}

export async function updateActiveListing(
  listingId: string,
  sellerId: string,
  patch: { title?: string; description?: string; priceEuros?: number },
): Promise<void> {
  const snap = await getDoc(listingRef(listingId));
  if (!snap.exists()) throw new Error("Anuncio no encontrado.");
  const data = snap.data();
  if (data.sellerId !== sellerId) throw new Error("No autorizado.");
  if (data.status !== "active") throw new Error("Anuncio no editable.");
  const moderationStatus = data.moderationStatus as
    | MarketplaceModerationStatus
    | undefined;
  if (moderationStatus === "rejected") {
    throw new Error("Este anuncio no se publicó y no se puede editar.");
  }

  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (patch.title != null) {
    const t = patch.title.trim();
    if (t.length < 3 || t.length > 80) throw new Error("Título inválido.");
    updates.title = t;
  }
  if (patch.description != null) {
    const d = patch.description.trim();
    if (d.length < 10 || d.length > 2000) throw new Error("Descripción inválida.");
    updates.description = d;
  }
  if (patch.priceEuros != null) {
    if (patch.priceEuros < 1 || patch.priceEuros > 99_999) {
      throw new Error("Precio inválido.");
    }
    updates.priceEuros = Math.round(patch.priceEuros);
  }

  const hasContentChange =
    "title" in updates || "description" in updates || "priceEuros" in updates;
  if (hasContentChange && (moderationStatus === "approved" || !moderationStatus)) {
    updates.moderationStatus = "pending";
  }

  await updateDoc(listingRef(listingId), updates);
}

/** Elimina un anuncio del mercadillo (coach o vendedor). */
export async function removeMarketplaceListing(
  listingId: string,
): Promise<void> {
  const snap = await getDoc(listingRef(listingId));
  if (!snap.exists()) throw new Error("Anuncio no encontrado.");

  const data = snap.data();
  const paths = (data.storagePaths as string[] | undefined) ?? [];
  for (const storagePath of paths) {
    try {
      await deleteObject(ref(getFirebaseStorage(), storagePath));
    } catch {
      /* archivo ya borrado */
    }
  }

  await deleteDoc(listingRef(listingId));
}

export function getMarketplaceShareUrl(listingId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/mercadillo/${listingId}`;
  }
  return `/mercadillo/${listingId}`;
}
