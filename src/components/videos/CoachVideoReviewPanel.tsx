"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ProgressVideoCard } from "@/components/videos/ProgressVideoCard";
import { getFirebaseAuthHeaders } from "@/lib/auth/firebase-auth-headers";
import {
  fetchStudentProgressVideos,
  saveCoachVideoNotes,
} from "@/lib/firebase/progress-videos";
import type { ProgressVideo } from "@/types/progress-video";

interface CoachVideoReviewPanelProps {
  studentId: string;
}

function CoachVideoReviewForm({
  video,
  studentId,
  onSaved,
}: {
  video: ProgressVideo;
  studentId: string;
  onSaved: () => void;
}) {
  const [notes, setNotes] = useState(video.coachNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNotes(video.coachNotes);
  }, [video.coachNotes, video.id]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const trimmed = notes.trim();
      if (!trimmed) {
        setError("Escribe los apuntes antes de publicar.");
        setSaving(false);
        return;
      }
      await saveCoachVideoNotes(studentId, video.id, trimmed);
      try {
        await fetch("/api/push/video-reviewed", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await getFirebaseAuthHeaders()),
          },
          body: JSON.stringify({ studentId, videoId: video.id }),
        });
      } catch {
        /* push opcional */
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-zinc-800 bg-zinc-950/50 px-5 py-4"
    >
      <label className="block text-sm font-medium text-sky-300">
        Apuntes de corrección para el alumno
        <textarea
          rows={6}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Qué hace bien, qué corregir, ejercicios recomendados…"
          className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
        />
      </label>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="btn-primary-sm mt-3 disabled:opacity-50"
      >
        {saving ? "Publicando…" : "Confirmar y notificar al alumno"}
      </button>
    </form>
  );
}

export function CoachVideoReviewPanel({ studentId }: CoachVideoReviewPanelProps) {
  const [videos, setVideos] = useState<ProgressVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setVideos(await fetchStudentProgressVideos(studentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = videos.filter((v) => v.status !== "reviewed" || !v.coachNotes.trim());

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Revisa los vídeos del alumno y escribe apuntes. Pulsa confirmar para
        publicarlos; el alumno recibirá un aviso en el móvil.
      </p>

      {pending.length > 0 && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          {pending.length} vídeo{pending.length > 1 ? "s" : ""} pendiente
          {pending.length > 1 ? "s" : ""} de corrección
        </p>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}
      {loading && <p className="text-zinc-500">Cargando vídeos…</p>}

      {!loading && videos.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-700 py-10 text-center text-zinc-500">
          Este alumno aún no ha subido vídeos.
        </p>
      )}

      <div className="space-y-8">
        {videos.map((video) => (
          <div key={video.id}>
            <ProgressVideoCard video={video} showCoachNotes={false} />
            <div className="-mt-2 overflow-hidden rounded-b-2xl border border-t-0 border-zinc-800 bg-zinc-900/80">
              <CoachVideoReviewForm
                video={video}
                studentId={studentId}
                onSaved={load}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
