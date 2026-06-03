"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { getFirebaseAuthHeaders } from "@/lib/auth/firebase-auth-headers";
import { ProgressVideoCard } from "@/components/videos/ProgressVideoCard";
import { MobileFilePicker } from "@/components/ui/MobileFilePicker";
import {
  fetchAlumnoProgressVideos,
  uploadAlumnoProgressVideo,
  validateVideoFile,
} from "@/lib/firebase/progress-videos";
import { fetchAlumnoVideoCorrectionAllowance } from "@/lib/firebase/video-correction-quota";
import type { VideoCorrectionAllowance } from "@/lib/firebase/video-correction-quota";
import type { ProgressVideo } from "@/types/progress-video";
import Link from "next/link";

interface AlumnoVideosPanelProps {
  alumnoId: string;
}

export function AlumnoVideosPanel({ alumnoId }: AlumnoVideosPanelProps) {
  const [videos, setVideos] = useState<ProgressVideo[]>([]);
  const [allowance, setAllowance] = useState<VideoCorrectionAllowance | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, quota] = await Promise.all([
        fetchAlumnoProgressVideos(alumnoId),
        fetchAlumnoVideoCorrectionAllowance(alumnoId),
      ]);
      setVideos(list);
      setAllowance(quota);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar vídeos");
    } finally {
      setLoading(false);
    }
  }, [alumnoId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (allowance && !allowance.canUpload) {
      setError(
        "No tienes cupos de corrección disponibles. Solicita y paga una corrección en Reservar.",
      );
      return;
    }
    if (!selectedFile) {
      setError("Primero elige un vídeo de tu galería.");
      return;
    }
    const validation = validateVideoFile(selectedFile);
    if (validation) {
      setError(validation);
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const videoId = await uploadAlumnoProgressVideo(
        alumnoId,
        selectedFile,
        title,
      );
      setTitle("");
      setSelectedFile(null);
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

  const uploadDisabled = Boolean(allowance && !allowance.canUpload);

  return (
    <div className="space-y-8">
      {allowance?.pendingRequest && (
        <p className="alert-warning px-4 py-3">
          Tienes una solicitud de video corrección sin completar el pago.{" "}
          <Link href="/reservar?tipo=video" className="link-accent underline">
            Vuelve a reservar
          </Link>{" "}
          para pagar con tarjeta.
        </p>
      )}
      {allowance?.awaitingCoachApproval && (
        <p className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          Hemos recibido tu pago. Alejandro revisará tu solicitud y te avisará
          cuando puedas subir el material aquí.
        </p>
      )}
      {allowance && allowance.paidSlots > 0 && (
        <p className="text-sm text-zinc-400">
          Cupos pagados: {allowance.paidSlots} · Subidos: {allowance.uploadedCount}
          {allowance.remainingSlots > 0
            ? ` · Puedes subir ${allowance.remainingSlots} más`
            : " · Sin cupos libres"}
        </p>
      )}
      {uploadDisabled &&
        !allowance?.pendingRequest &&
        !allowance?.awaitingCoachApproval && (
        <p className="rounded-xl border border-zinc-700 bg-zinc-900/50 px-4 py-3 text-sm text-zinc-300">
          Para subir un vídeo a corregir,{" "}
          <Link href="/reservar?tipo=video" className="text-sky-300 underline">
            reserva video corrección
          </Link>{" "}
          (20 €/vídeo). Pagas con tarjeta y, cuando Alejandro acepte, podrás
          subir aquí.
        </p>
      )}

      <form
        onSubmit={handleUpload}
        className={`glass-panel rounded-2xl border-violet-500/20 p-6 ${uploadDisabled ? "opacity-60" : ""}`}
      >
        <h2 className="text-lg font-semibold text-sky-200">
          Subir un vídeo nuevo
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Desde el móvil: galería o archivos. MP4, MOV o WebM (máx. 200 MB).
          Cuando Alejandro publique la corrección, la verás aquí.
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

        <MobileFilePicker
          className="mt-4"
          accept="video/*,.mp4,.mov,.m4v,.webm"
          disabled={uploading || uploadDisabled}
          loading={uploading}
          label="Elegir vídeo del móvil"
          hint="Toca el botón y selecciona un vídeo de la galería"
          selectedName={selectedFile?.name ?? null}
          onFileSelected={(file) => {
            const validation = validateVideoFile(file);
            if (validation) {
              setError(validation);
              setSelectedFile(null);
              return;
            }
            setError(null);
            setSelectedFile(file);
          }}
        />

        {error && (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={uploading || uploadDisabled || !selectedFile}
          className="btn-primary-md mt-4 disabled:opacity-50"
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
