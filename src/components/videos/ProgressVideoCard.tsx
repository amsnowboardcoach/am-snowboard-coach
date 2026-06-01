"use client";

import { useEffect, useState } from "react";
import { formatFirestoreDate } from "@/lib/utils/dates";
import {
  formatVideoSize,
  getProgressVideoDownloadUrl,
} from "@/lib/firebase/progress-videos";
import type { ProgressVideo } from "@/types/progress-video";
import { cn } from "@/lib/utils/cn";

interface ProgressVideoCardProps {
  video: ProgressVideo;
  showCoachNotes?: boolean;
}

export function ProgressVideoCard({
  video,
  showCoachNotes = true,
}: ProgressVideoCardProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProgressVideoDownloadUrl(video.storagePath)
      .then((url) => {
        if (!cancelled) setVideoUrl(url);
      })
      .catch(() => {
        if (!cancelled) setLoadError("No se pudo cargar el vídeo.");
      });
    return () => {
      cancelled = true;
    };
  }, [video.storagePath]);

  const isReviewed = video.status === "reviewed" && video.coachNotes.trim();

  return (
    <article className="glass-panel overflow-hidden rounded-2xl">
      <div className="border-b border-zinc-800/80 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-zinc-100">{video.title}</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Subido {formatFirestoreDate(video.uploadedAt)} ·{" "}
              {formatVideoSize(video.sizeBytes)}
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              isReviewed
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-200",
            )}
          >
            {isReviewed ? "Corregido" : "Pendiente de corrección"}
          </span>
        </div>
      </div>

      {videoUrl && (
        <div className="bg-black">
          <video
            src={videoUrl}
            controls
            playsInline
            className="aspect-video w-full"
            preload="metadata"
          />
        </div>
      )}

      {loadError && (
        <p className="px-5 py-4 text-sm text-red-300">{loadError}</p>
      )}

      {showCoachNotes && isReviewed && (
        <div className="border-t border-zinc-800 bg-sky-500/5 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">
            Apuntes del coach
          </p>
          {video.coachNotesUpdatedAt && (
            <p className="mt-1 text-xs text-zinc-500">
              {formatFirestoreDate(video.coachNotesUpdatedAt)}
            </p>
          )}
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
            {video.coachNotes}
          </div>
        </div>
      )}

      {showCoachNotes && !isReviewed && (
        <p className="border-t border-zinc-800/80 px-5 py-4 text-sm text-zinc-500">
          Alejandro revisará tu vídeo y publicará los apuntes aquí.
        </p>
      )}
    </article>
  );
}
