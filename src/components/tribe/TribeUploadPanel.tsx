"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { COACH_ROLES, ROLES } from "@/constants/roles";
import {
  TRIBE_UPLOAD_LEGAL_CHECKBOX,
  TRIBE_UPLOAD_LEGAL_TITLE,
} from "@/constants/tribe-legal";
import { uploadTribePost } from "@/lib/firebase/tribe-posts";
import { MobileFilePicker } from "@/components/ui/MobileFilePicker";
import type { TribeMediaType } from "@/types/tribe-post";

interface TribeUploadPanelProps {
  onUploaded?: () => void;
}

export function TribeUploadPanel({ onUploaded }: TribeUploadPanelProps) {
  const { user, profile, loading } = useAuth();
  const [mediaType, setMediaType] = useState<TribeMediaType>("photo");
  const [caption, setCaption] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastFileName, setLastFileName] = useState<string | null>(null);

  const isStudent =
    profile?.role === ROLES.STUDENT &&
    Boolean(user) &&
    !user?.isAnonymous;

  if (loading) return null;

  if (!user || user.isAnonymous || !profile) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-6 text-center text-sm text-zinc-400">
        <p className="font-medium text-zinc-300">Publicar en La Tribu</p>
        <p className="mt-2">
          Solo{" "}
          <strong className="font-medium text-zinc-200">alumnos registrados</strong>{" "}
          pueden subir fotos y vídeos. Puedes ver, reaccionar y comentar sin cuenta.
        </p>
        <p className="mt-3">
          <Link href="/login" className="text-sky-400 hover:underline">
            Área de alumno
          </Link>
          <span className="text-zinc-600"> — entrar o registrarte</span>
        </p>
      </div>
    );
  }

  if (!isStudent) {
    const isCoach = profile.role && COACH_ROLES.includes(profile.role);
    return (
      <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-6 text-center text-sm text-zinc-400">
        {isCoach ? (
          <p>
            Las publicaciones de alumnos se aprueban en el{" "}
            <Link
              href="/coach?tab=tribu"
              className="text-sky-400 hover:underline"
            >
              panel del coach → La Tribu
            </Link>
            . Aquí solo suben alumnos con cuenta.
          </p>
        ) : (
          <p>Solo alumnos registrados pueden publicar en La Tribu.</p>
        )}
      </div>
    );
  }

  async function handleFileSelected(file: File) {
    if (!user || !profile) return;
    if (!legalAccepted) {
      setError(
        "Antes de subir, marca la casilla de consentimiento más abajo.",
      );
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setLastFileName(file.name);
    try {
      await uploadTribePost({
        authorId: user.uid,
        authorDisplayName: profile.displayName || user.displayName || "Alumno",
        authorPhotoURL: profile.photoURL || user.photoURL || undefined,
        authorRole: ROLES.STUDENT,
        file,
        mediaType,
        caption,
        legalConsent: true,
      });
      setCaption("");
      setLastFileName(null);
      setSuccess(
        "¡Gracias! Tu momento está en cola. Cuando el coach lo apruebe, aparecerá en el feed para toda la comunidad.",
      );
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  const accept =
    mediaType === "photo"
      ? "image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
      : "video/*,.mp4,.mov,.m4v";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h2 className="text-lg font-semibold text-zinc-100">Subir momento</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Fotos y vídeos desde la galería del móvil. Se publican tras revisión.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["photo", "video"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setMediaType(t);
              setError(null);
              setLastFileName(null);
            }}
            className={`min-h-11 touch-manipulation rounded-full px-4 py-1.5 text-sm font-medium transition ${
              mediaType === t
                ? "bg-sky-500/20 text-sky-300"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {t === "photo" ? "Foto" : "Vídeo"}
          </button>
        ))}
      </div>

      <label className="mt-4 block text-sm text-zinc-400">
        Pie de foto (opcional)
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={500}
          placeholder="Día en Snowpark Sulayr, primer 50-50…"
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
        />
      </label>

      <details className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm">
        <summary className="cursor-pointer font-medium text-sky-300/90">
          {TRIBE_UPLOAD_LEGAL_TITLE}
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-zinc-500">
          Debes tener derecho a publicar el contenido y consentimiento de quien
          aparece. El coach puede moderar o retirar publicaciones.
        </p>
      </details>

      <label className="mt-4 flex cursor-pointer gap-3 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={legalAccepted}
          onChange={(e) => setLegalAccepted(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 rounded border-zinc-600"
        />
        <span>{TRIBE_UPLOAD_LEGAL_CHECKBOX}</span>
      </label>

      <MobileFilePicker
        className="mt-4"
        accept={accept}
        disabled={!legalAccepted}
        loading={uploading}
        label={`Elegir ${mediaType === "photo" ? "foto" : "vídeo"} del móvil`}
        hint={
          mediaType === "photo"
            ? "JPG, PNG o HEIC · máx. 12 MB"
            : "MP4 o MOV · máx. 100 MB"
        }
        selectedName={lastFileName}
        onFileSelected={handleFileSelected}
      />

      {error && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 text-sm text-emerald-400" role="status">
          {success}
        </p>
      )}
    </div>
  );
}
