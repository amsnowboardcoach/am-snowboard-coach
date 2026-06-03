"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { resolvedProfilePhotoURL } from "@/lib/auth/auth-photo";
import { ROLES } from "@/constants/roles";
import {
  TRIBE_UPLOAD_LEGAL_CHECKBOX,
  TRIBE_UPLOAD_LEGAL_TITLE,
} from "@/constants/tribe-legal";
import { TRICK_STATUS_LABEL } from "@/constants/trick-status";
import { MobileFilePicker } from "@/components/ui/MobileFilePicker";
import { buildPassportTribeCaption } from "@/lib/tribe/passport-share-caption";
import { uploadTribePassportAchievement } from "@/lib/firebase/tribe-posts";
import { formatBytes } from "@/lib/utils/format-bytes";
import type { TrickWithProgress } from "@/types/tricks";
import type { TrickStatus } from "@/types/tricks";

interface SharePassportToTribeDialogProps {
  trick: TrickWithProgress | null;
  open: boolean;
  onClose: () => void;
  onShared?: () => void;
}

export function SharePassportToTribeDialog({
  trick,
  open,
  onClose,
  onShared,
}: SharePassportToTribeDialogProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [optionalPhoto, setOptionalPhoto] = useState<File | null>(null);
  const [captionExtra, setCaptionExtra] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setOptionalPhoto(null);
    setCaptionExtra("");
    setLegalAccepted(false);
    setError(null);
    setUploadProgress(null);
  }, [open, trick?.id]);

  if (!open || !trick) return null;

  const status = (trick.progress?.status ?? "locked") as TrickStatus;
  const previewCaption = buildPassportTribeCaption({
    trickName: trick.name,
    status,
    category: trick.category,
    extra: captionExtra,
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!trick || !user || !profile) return;
    if (!legalAccepted) {
      setError("Marca la casilla de consentimiento antes de publicar.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      await refreshProfile();
      await uploadTribePassportAchievement({
        authorId: user.uid,
        authorDisplayName: profile.displayName || user.displayName || "Alumno",
        authorPhotoURL: resolvedProfilePhotoURL(profile, user),
        authorRole: ROLES.ALUMNO,
        trickId: trick.id,
        trickName: trick.name,
        trickStatus: status,
        category: trick.category,
        optionalPhoto,
        captionExtra,
        legalConsent: true,
        onUploadProgress: setUploadProgress,
      });
      onShared?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo compartir el logro");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-passport-title"
    >
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Cerrar"
        onClick={() => !uploading && onClose()}
      />
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="relative z-10 max-h-[min(90vh,640px)] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl sm:p-6"
      >
        <h2 id="share-passport-title" className="text-lg font-semibold text-zinc-100">
          Compartir en La Tribu
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          <span className="font-medium text-zinc-200">{trick.name}</span>
          {" · "}
          {TRICK_STATUS_LABEL[status]}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Se publicará una tarjeta con tu logro (o la foto que elijas). El coach
          la revisará antes de salir en el feed.
        </p>

        <MobileFilePicker
          className="mt-4"
          accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
          disabled={uploading || !legalAccepted}
          loading={uploading}
          label="Añadir tu foto (opcional)"
          hint="Si no eliges foto, usamos una tarjeta del logro · máx. 12 MB"
          selectedName={
            optionalPhoto
              ? `${optionalPhoto.name} (${formatBytes(optionalPhoto.size)})`
              : null
          }
          onFileSelected={(file) => {
            setOptionalPhoto(file);
            setError(null);
          }}
        />

        <label className="mt-4 block text-sm text-zinc-300">
          Texto adicional (opcional)
          <textarea
            value={captionExtra}
            onChange={(e) => setCaptionExtra(e.target.value)}
            maxLength={200}
            disabled={uploading}
            rows={2}
            placeholder="¡Por fin lo conseguí en Sulayr!"
            className="mt-1.5 w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-zinc-100"
          />
        </label>

        <p className="mt-3 rounded-xl bg-zinc-900/80 px-3 py-2 text-xs text-zinc-500">
          Vista previa del pie: {previewCaption}
        </p>

        <details className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm">
          <summary className="cursor-pointer font-medium text-sky-300/90">
            {TRIBE_UPLOAD_LEGAL_TITLE}
          </summary>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            Debes tener derecho a publicar el contenido. El coach puede moderar o
            retirar publicaciones.
          </p>
        </details>

        <label className="mt-3 flex cursor-pointer gap-3 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={legalAccepted}
            disabled={uploading}
            onChange={(e) => setLegalAccepted(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-zinc-600"
          />
          <span>{TRIBE_UPLOAD_LEGAL_CHECKBOX}</span>
        </label>

        {uploadProgress !== null && uploading && (
          <p className="mt-3 text-xs text-zinc-500">Subiendo… {uploadProgress}%</p>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={onClose}
            className="min-h-10 rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={uploading || !legalAccepted}
            className="btn-primary-md min-h-10 disabled:opacity-50"
          >
            {uploading ? "Enviando…" : "Enviar a revisión"}
          </button>
        </div>
      </form>
    </div>
  );
}
