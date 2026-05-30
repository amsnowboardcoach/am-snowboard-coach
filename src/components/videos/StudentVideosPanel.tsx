"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { getFirebaseAuthHeaders } from "@/lib/auth/firebase-auth-headers";
import { ProgressVideoCard } from "@/components/videos/ProgressVideoCard";
import {
  fetchStudentProgressVideos,
  uploadStudentProgressVideo,
  validateVideoFile,
} from "@/lib/firebase/progress-videos";
import type { ProgressVideo } from "@/types/progress-video";

interface StudentVideosPanelProps {
  studentId: string;
}

export function StudentVideosPanel({ studentId }: StudentVideosPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [videos, setVideos] = useState<ProgressVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchStudentProgressVideos(studentId);
      setVideos(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar vídeos");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Selecciona un vídeo.");
      return;
    }
    const validation = validateVideoFile(file);
    if (validation) {
      setError(validation);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const videoId = await uploadStudentProgressVideo(studentId, file, title);
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      try {
        await fetch("/api/push/video-uploaded", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await getFirebaseAuthHeaders()),
          },
          body: JSON.stringify({ videoId }),
        });
      } catch {
        /* push opcional */
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleUpload}
        className="glass-panel rounded-2xl border-violet-500/20 p-6"
      >
        <h2 className="text-lg font-semibold text-violet-200">
          Subir un vídeo nuevo
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Formatos MP4, MOV o WebM (máx. 100 MB). Cuando Alejandro publique la
          corrección, la verás aquí con sus apuntes.
        </p>

        <label className="mt-4 block text-sm text-zinc-300">
          Título (opcional)
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Giro en pista azul"
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          />
        </label>

        <label className="mt-4 block text-sm text-zinc-300">
          Archivo de vídeo *
          <input
            ref={fileRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,video/*"
            className="mt-2 block w-full text-sm text-zinc-400 file:mr-4 file:rounded-full file:border-0 file:bg-violet-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-950"
          />
        </label>

        {error && (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="mt-4 rounded-full bg-violet-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-violet-400 disabled:opacity-50"
        >
          {uploading ? "Subiendo…" : "Subir vídeo"}
        </button>
      </form>

      <section>
        <h2 className="text-lg font-semibold">Mis vídeos</h2>
        {loading && <p className="mt-4 text-zinc-500">Cargando…</p>}
        {!loading && videos.length === 0 && (
          <p className="mt-4 rounded-xl border border-dashed border-zinc-700 py-12 text-center text-zinc-500">
            Aún no has subido ningún vídeo.
          </p>
        )}
        <div className="mt-6 space-y-6">
          {videos.map((video) => (
            <ProgressVideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>
    </div>
  );
}
