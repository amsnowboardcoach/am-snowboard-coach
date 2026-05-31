"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { COACH_ROLES, ROLES } from "@/constants/roles";
import { uploadTribePost } from "@/lib/firebase/tribe-posts";
import type { TribeMediaType } from "@/types/tribe-post";
import { MediaUploadConsentModal } from "@/components/tribe/MediaUploadConsentModal";

interface TribeUploadPanelProps {
  onUploaded?: () => void;
}

export function TribeUploadPanel({ onUploaded }: TribeUploadPanelProps) {
  const { user, profile, loading } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mediaType, setMediaType] = useState<TribeMediaType>("photo");
  const [caption, setCaption] = useState("");
  const [consentOpen, setConsentOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  function openPicker() {
    setConsentOpen(true);
  }

  function afterConsent() {
    setConsentOpen(false);
    fileRef.current?.click();
  }

  async function handleFileChange() {
    const file = fileRef.current?.files?.[0];
    if (!file || !user || !profile) return;

    setUploading(true);
    setError(null);
    setSuccess(null);
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
      if (fileRef.current) fileRef.current.value = "";
      setSuccess(
        "Enviado. Lo revisaré y aparecerá en el feed cuando lo apruebe.",
      );
      onUploaded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <h2 className="text-lg font-semibold text-zinc-100">Subir momento</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Como alumno registrado. Antes de publicar verás el aviso legal sobre
        derechos de imagen.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["photo", "video"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setMediaType(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
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
          placeholder="Día en Sulayr, primer 50-50…"
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100"
        />
      </label>

      <input
        ref={fileRef}
        type="file"
        accept={mediaType === "photo" ? "image/*" : "video/*"}
        className="hidden"
        onChange={() => void handleFileChange()}
      />

      <button
        type="button"
        onClick={openPicker}
        disabled={uploading}
        className="mt-4 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-50"
      >
        {uploading ? "Subiendo…" : `Elegir ${mediaType === "photo" ? "foto" : "vídeo"}`}
      </button>

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

      <MediaUploadConsentModal
        open={consentOpen}
        onClose={() => setConsentOpen(false)}
        onConfirm={afterConsent}
      />
    </div>
  );
}
