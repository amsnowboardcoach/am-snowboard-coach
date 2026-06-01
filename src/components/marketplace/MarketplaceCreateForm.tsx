"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import {
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_CONDITIONS,
  MARKETPLACE_DISCLAIMER,
  MARKETPLACE_MAX_IMAGES,
} from "@/constants/marketplace";
import { createMarketplaceListing } from "@/lib/firebase/marketplace-listings";
import type { MarketplaceCategory, MarketplaceCondition } from "@/types/marketplace";

interface MarketplaceCreateFormProps {
  onCreated?: () => void;
}

export function MarketplaceCreateForm({ onCreated }: MarketplaceCreateFormProps) {
  const { user, profile, loading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceEuros, setPriceEuros] = useState("");
  const [condition, setCondition] = useState<MarketplaceCondition>("used");
  const [category, setCategory] = useState<MarketplaceCategory>("tabla");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [previewCount, setPreviewCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!profile && !user) return;
    if (!contactPhone && profile?.phone) {
      setContactPhone(profile.phone);
    }
    if (!contactEmail) {
      setContactEmail(profile?.email || user?.email || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cargar perfil
  }, [profile?.phone, profile?.email, user?.email]);

  if (loading) return null;

  if (!user || user.isAnonymous || !profile) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-6 text-center text-sm text-zinc-400">
        <p className="font-medium text-zinc-300">Publicar en el mercadillo</p>
        <p className="mt-2">
          Cualquier persona <strong className="text-zinc-200">registrada</strong>{" "}
          puede vender material de snowboard. Crea cuenta o entra para publicar.
        </p>
        <p className="mt-3">
          <Link href="/login" className="link-accent underline-offset-2 hover:underline">
            Área de alumno
          </Link>
          <span className="text-zinc-500"> — entrar o registrarte</span>
        </p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const files = fileRef.current?.files;
    if (!files?.length || !user || !profile) return;

    const price = Number(priceEuros);
    if (!Number.isFinite(price) || price < 1 || price > 99_999) {
      setError("Indica un precio válido entre 1 y 99 999 €.");
      return;
    }
    const phone = contactPhone.trim();
    const email = (
      contactEmail.trim() ||
      profile.email ||
      user.email ||
      ""
    ).trim();
    if (!phone && !email) {
      setError("Indica teléfono o email para que te contacten.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createMarketplaceListing({
        sellerId: user.uid,
        sellerDisplayName:
          profile.displayName || user.displayName || "Usuario AM",
        title,
        description,
        priceEuros: price,
        condition,
        category,
        contactPhone: phone || undefined,
        contactEmail: email || undefined,
        imageFiles: Array.from(files),
      });
      setTitle("");
      setDescription("");
      setPriceEuros("");
      setContactPhone(profile.phone ?? "");
      setContactEmail(profile.email || user.email || "");
      if (fileRef.current) fileRef.current.value = "";
      setPreviewCount(0);
      setSuccess(
        "Anuncio enviado. Alejandro lo revisará antes de publicarlo en el mercadillo. Cuando lo vendas, márcalo como vendido.",
      );
      onCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al publicar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
    >
      <h2 className="text-lg font-semibold text-zinc-100">Nuevo anuncio</h2>
      <p className="text-xs text-zinc-500">{MARKETPLACE_DISCLAIMER}</p>

      <label className="block text-sm text-zinc-300">
        Título *
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="Burton Custom 154 — buen estado"
          className="form-input mt-1"
        />
      </label>

      <label className="block text-sm text-zinc-300">
        Descripción *
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          placeholder="Estado, talla, año, motivo de venta…"
          className="form-input mt-1"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-zinc-300">
          Precio (€) *
          <input
            type="number"
            required
            min={1}
            max={99999}
            step={1}
            value={priceEuros}
            onChange={(e) => setPriceEuros(e.target.value)}
            className="form-input mt-1"
          />
        </label>
        <label className="block text-sm text-zinc-300">
          Estado
          <select
            value={condition}
            onChange={(e) =>
              setCondition(e.target.value as MarketplaceCondition)
            }
            className="form-input mt-1"
          >
            {MARKETPLACE_CONDITIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm text-zinc-300">
        Categoría
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as MarketplaceCategory)}
          className="form-input mt-1"
        >
          {MARKETPLACE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-zinc-300">
          WhatsApp / teléfono
          <input
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="+34 600 000 000"
            className="form-input mt-1"
          />
        </label>
        <label className="block text-sm text-zinc-300">
          Email de contacto
          <input
            type="email"
            value={contactEmail || profile.email || user.email || ""}
            onChange={(e) => setContactEmail(e.target.value)}
            className="form-input mt-1"
          />
        </label>
      </div>
      <p className="text-xs text-zinc-500">
        Indica al menos teléfono o email para que te contacten.
      </p>

      <label className="block text-sm text-zinc-300">
        Fotos * (máx. {MARKETPLACE_MAX_IMAGES})
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          required
          onChange={() =>
            setPreviewCount(fileRef.current?.files?.length ?? 0)
          }
          className="mt-2 block w-full text-sm text-zinc-400 file:mr-3 file:rounded-full file:border-0 file:bg-sky-500/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-sky-300"
        />
        {previewCount > 0 && (
          <span className="mt-1 block text-xs text-zinc-500">
            {previewCount} foto{previewCount > 1 ? "s" : ""} seleccionada
            {previewCount > 1 ? "s" : ""}
          </span>
        )}
      </label>

      {error && (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-400" role="status">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary-md disabled:opacity-50 sm:px-10"
      >
        {submitting ? "Publicando…" : "Publicar anuncio"}
      </button>
    </form>
  );
}
