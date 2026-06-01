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
import { cn } from "@/lib/utils/cn";

interface TribeUploadPanelProps {
  onUploaded?: () => void;
}

function GuestUploadCta() {
  return (
    <div className="glass-panel rounded-2xl p-6 text-center sm:p-8">
      <p className="text-lg font-semibold text-zinc-100">Publicar en La Tribu</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
        Solo{" "}
        <strong className="font-medium text-zinc-200">alumnos registrados</strong>{" "}
        pueden subir fotos y vídeos. Cualquiera puede ver el feed, reaccionar y
        comentar.
      </p>
      <Link
        href="/login"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-sky-500 px-8 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400"
      >
        Entrar al área de alumno
      </Link>
      <p className="mt-3 text-xs text-zinc-600">
        ¿Primera vez?{" "}
        <Link href="/registro" className="text-sky-400 hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}

export function TribeUploadPanel({ onUploaded }: TribeUploadPanelProps) {
  const { user, profile, loading } = useAuth();
  const [expanded, setExpanded] = useState(false);
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
    return <GuestUploadCta />;
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
      setExpanded(false);
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
    <div className="glass-panel overflow-hidden rounded-2xl">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-zinc-800/30 sm:px-6 sm:py-5"
      >
        <div>
          <p className="font-semibold text-zinc-100">Subir un momento</p>
          <p className="mt-0.5 text-sm text-zinc-500">
            Foto o vídeo desde el móvil · revisión del coach
          </p>
        </div>
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-lg text-sky-300 transition",
            expanded && "rotate-45",
          )}
          aria-hidden
        >
          +
        </span>
      </button>

      {success && !expanded && (
        <p
          className="border-t border-zinc-800/80 px-5 py-3 text-sm text-emerald-400 sm:px-6"
          role="status"
        >
          {success}
        </p>
      )}

      {expanded && (
        <div className="border-t border-zinc-800/80 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          <div className="flex flex-wrap gap-2">
            {(["photo", "video"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setMediaType(t);
                  setError(null);
                  setLastFileName(null);
                }}
                className={cn(
                  "min-h-10 touch-manipulation rounded-full px-4 py-1.5 text-sm font-medium transition",
                  mediaType === t
                    ? "bg-sky-500/20 text-sky-300"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200",
                )}
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
              className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
            />
          </label>

          <details className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm">
            <summary className="cursor-pointer font-medium text-sky-300/90">
              {TRIBE_UPLOAD_LEGAL_TITLE}
            </summary>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              Debes tener derecho a publicar el contenido y consentimiento de
              quien aparece. El coach puede moderar o retirar publicaciones.
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
      )}
    </div>
  );
}
