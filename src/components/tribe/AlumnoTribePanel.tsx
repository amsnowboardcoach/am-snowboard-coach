"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { ROLES } from "@/constants/roles";
import {
  TRIBE_UPLOAD_LEGAL_CHECKBOX,
  TRIBE_UPLOAD_LEGAL_TITLE,
} from "@/constants/tribe-legal";
import { MobileFilePicker } from "@/components/ui/MobileFilePicker";
import {
  fetchTribePostsByAuthor,
  uploadTribePost,
  validateTribeMediaFile,
} from "@/lib/firebase/tribe-posts";
import { formatBytes } from "@/lib/utils/format-bytes";
import { cn } from "@/lib/utils/cn";
import type { TribeMediaType, TribeModerationStatus, TribePost } from "@/types/tribe-post";

interface AlumnoTribePanelProps {
  alumnoId: string;
}

const STATUS_LABEL: Record<TribeModerationStatus, string> = {
  pending: "En revisión",
  approved: "Publicado",
  rejected: "No publicado",
};

const STATUS_CLASS: Record<TribeModerationStatus, string> = {
  pending: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
  approved: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
  rejected: "bg-zinc-700/50 text-zinc-400 ring-zinc-600",
};

function formatPostDate(post: TribePost): string {
  try {
    return post.createdAt.toDate().toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function AlumnoTribePanel({ alumnoId }: AlumnoTribePanelProps) {
  const { user, profile, refreshProfile } = useAuth();
  const [posts, setPosts] = useState<TribePost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [mediaType, setMediaType] = useState<TribeMediaType>("photo");
  const [caption, setCaption] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    setPostsError(null);
    try {
      const list = await fetchTribePostsByAuthor(alumnoId);
      setPosts(list);
    } catch (err) {
      setPostsError(
        err instanceof Error ? err.message : "No se pudieron cargar tus publicaciones",
      );
    } finally {
      setLoadingPosts(false);
    }
  }, [alumnoId]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const accept =
    mediaType === "photo"
      ? "image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
      : "video/*,.mp4,.mov,.m4v";

  function handleFilePicked(file: File) {
    const validation = validateTribeMediaFile(file, mediaType);
    if (validation) {
      setError(validation);
      setSelectedFile(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;

    if (!legalAccepted) {
      setError("Marca la casilla de consentimiento antes de publicar.");
      return;
    }
    if (!selectedFile) {
      setError("Primero elige una foto o un vídeo de tu galería.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);

    try {
      await refreshProfile();
      await uploadTribePost({
        authorId: user.uid,
        authorDisplayName: profile.displayName || user.displayName || "Alumno",
        authorPhotoURL: profile.photoURL || user.photoURL || undefined,
        authorRole: ROLES.ALUMNO,
        file: selectedFile,
        mediaType,
        caption,
        legalConsent: true,
        onUploadProgress: setUploadProgress,
      });
      setCaption("");
      setSelectedFile(null);
      setLegalAccepted(false);
      setSuccess(
        "¡Enviado! Alejandro lo revisará pronto. Cuando lo apruebe, aparecerá en el feed público de La Tribu.",
      );
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  const pendingCount = posts.filter((p) => p.moderationStatus === "pending").length;

  return (
    <div className="space-y-8">
      {pendingCount > 0 && (
        <p className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
          Tienes {pendingCount}{" "}
          {pendingCount === 1 ? "publicación" : "publicaciones"} esperando revisión
          del coach.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="glass-panel rounded-2xl p-5 sm:p-6"
      >
        <h2 className="text-lg font-semibold text-zinc-100">
          Subir foto o vídeo
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Solo desde aquí (tu panel de alumno). El contenido pasa por revisión
          antes de salir en el feed público.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {(["photo", "video"] as const).map((t) => (
            <button
              key={t}
              type="button"
              disabled={uploading}
              onClick={() => {
                setMediaType(t);
                setSelectedFile(null);
                setError(null);
              }}
              className={cn(
                "min-h-10 touch-manipulation rounded-full px-4 py-1.5 text-sm font-medium transition disabled:opacity-50",
                mediaType === t
                  ? "chip-toggle-active"
                  : "border border-zinc-700 bg-zinc-900/60 text-zinc-400",
              )}
            >
              {t === "photo" ? "📷 Foto" : "🎬 Vídeo"}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm text-zinc-300">
          Pie de foto (opcional)
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={500}
            disabled={uploading}
            placeholder="Día en Sulayr, primer 50-50…"
            className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100 disabled:opacity-60"
          />
        </label>

        <MobileFilePicker
          className="mt-4"
          accept={accept}
          disabled={uploading || !legalAccepted}
          loading={uploading}
          label={`Elegir ${mediaType === "photo" ? "foto" : "vídeo"} del móvil`}
          hint={
            mediaType === "photo"
              ? "JPG, PNG o HEIC · máx. 12 MB"
              : "MP4 o MOV · máx. 100 MB · usa Wi‑Fi si es largo"
          }
          selectedName={
            selectedFile
              ? `${selectedFile.name} (${formatBytes(selectedFile.size)})`
              : null
          }
          onFileSelected={handleFilePicked}
        />

        <details className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm">
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
            disabled={uploading}
            onChange={(e) => setLegalAccepted(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-zinc-600"
          />
          <span>{TRIBE_UPLOAD_LEGAL_CHECKBOX}</span>
        </label>

        {uploadProgress !== null && uploading && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-zinc-500">
              <span>Subiendo archivo…</span>
              <span>{uploadProgress}%</span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-800"
              role="progressbar"
              aria-valuenow={uploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-sky-500 transition-[width] duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-3 text-sm text-emerald-400" role="status">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={uploading || !selectedFile || !legalAccepted}
          className="btn-primary-md mt-5 disabled:opacity-50"
        >
          {uploading ? "Subiendo…" : "Enviar a revisión"}
        </button>
      </form>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-100">
            Mis publicaciones
          </h2>
          <Link
            href="/tribu#feed"
            className="text-sm font-medium link-accent"
          >
            Ver feed público →
          </Link>
        </div>

        {postsError && (
          <p className="mt-4 text-sm text-red-300" role="alert">
            {postsError}
          </p>
        )}

        {loadingPosts && (
          <p className="mt-4 text-sm text-zinc-500">Cargando…</p>
        )}

        {!loadingPosts && posts.length === 0 && (
          <p className="mt-4 rounded-xl border border-dashed border-zinc-700 py-12 text-center text-sm text-zinc-500">
            Aún no has subido nada a La Tribu.
          </p>
        )}

        <ul className="mt-4 space-y-3">
          {posts.map((post) => (
            <li
              key={post.id}
              className="flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 sm:p-4"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-zinc-800 sm:size-20">
                {post.mediaType === "photo" ? (
                  <Image
                    src={post.mediaUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">
                    ▶
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                      STATUS_CLASS[post.moderationStatus],
                    )}
                  >
                    {STATUS_LABEL[post.moderationStatus]}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {post.mediaType === "photo" ? "Foto" : "Vídeo"}
                    {formatPostDate(post) ? ` · ${formatPostDate(post)}` : ""}
                  </span>
                </div>
                {post.caption && (
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
                    {post.caption}
                  </p>
                )}
                {post.moderationStatus === "approved" && (
                  <Link
                    href={`/tribu?post=${post.id}`}
                    className="mt-2 inline-block text-xs font-medium link-accent"
                  >
                    Ver en el feed →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
