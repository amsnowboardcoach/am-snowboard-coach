"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CoachAlumnoBroadcastPanel } from "@/components/coach/CoachAlumnoBroadcastPanel";
import { DeleteAlumnoButton } from "@/components/coach/DeleteAlumnoButton";
import { AlumnoLevelSelect } from "@/components/coach/AlumnoLevelSelect";
import { fetchCoachAlumnos } from "@/lib/firebase/alumnos";
import { fetchAlumnoProgressVideos } from "@/lib/firebase/progress-videos";
import { ensureTricksCatalog } from "@/lib/firebase/tricks";
import type { UserProfile } from "@/types/firestore";
import { cn } from "@/lib/utils/cn";

interface AlumnoRow extends UserProfile {
  pendingVideos: number;
}

interface CoachHubAlumnosPanelProps {
  coachId: string;
}

export function CoachHubAlumnosPanel({ coachId }: CoachHubAlumnosPanelProps) {
  const [alumnos, setAlumnos] = useState<AlumnoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureTricksCatalog();
      const list = await fetchCoachAlumnos(coachId);
      const rows = await Promise.all(
        list.map(async (s) => {
          const videos = await fetchAlumnoProgressVideos(s.uid);
          const pendingVideos = videos.filter(
            (v) => v.status === "pending_review",
          ).length;
          return { ...s, pendingVideos };
        }),
      );
      rows.sort((a, b) => b.pendingVideos - a.pendingVideos);
      setAlumnos(rows);
      setSelectedIds((prev) => {
        const valid = new Set(rows.map((r) => r.uid));
        return new Set([...prev].filter((id) => valid.has(id)));
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar alumnos";
      if (msg.includes("index")) {
        setError(
          "Crea el índice en Firebase: firebase deploy --only firestore:indexes",
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const pendingTotal = alumnos.reduce((n, s) => n + s.pendingVideos, 0);
  const allSelected =
    alumnos.length > 0 && selectedIds.size === alumnos.length;
  const selectedList = [...selectedIds];

  function toggleAlumno(uid: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(alumnos.map((s) => s.uid)));
    }
  }

  function patchAlumnoLevel(uid: string, level: UserProfile["level"]) {
    setAlumnos((prev) =>
      prev.map((s) => (s.uid === uid ? { ...s, level } : s)),
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Gestiona corrección de vídeo, Pasaporte de Trucos y envía avisos
        (estación cerrada, retrasos, etc.) a los alumnos que elijas.
      </p>

      {!loading && alumnos.length > 0 && (
        <CoachAlumnoBroadcastPanel
          selectedIds={selectedList}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      {pendingTotal > 0 && (
        <p className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-200">
          {pendingTotal} vídeo{pendingTotal > 1 ? "s" : ""} esperando tu revisión.
        </p>
      )}

      {loading && <p className="text-zinc-500">Cargando alumnos…</p>}
      {error && <p className="text-sm text-red-300">{error}</p>}

      {!loading && !error && alumnos.length === 0 && (
        <p className="rounded-xl border border-dashed border-zinc-700 py-12 text-center text-zinc-500">
          Aún no hay alumnos registrados. Cuando se registren con tu coach
          asignado, aparecerán aquí.
        </p>
      )}

      {!loading && alumnos.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            {selectedIds.size > 0
              ? `${selectedIds.size} seleccionado${selectedIds.size > 1 ? "s" : ""}`
              : "Marca alumnos para enviarles un aviso"}
          </p>
          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-sm font-medium link-accent"
          >
            {allSelected ? "Quitar todos" : "Seleccionar todos"}
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {alumnos.map((s) => {
          const selected = selectedIds.has(s.uid);
          return (
            <li
              key={s.uid}
              className={cn(
                "rounded-xl border px-4 py-4 transition sm:px-5",
                selected
                  ? "border-sky-500/40 bg-sky-500/5"
                  : "border-zinc-800 bg-zinc-900/40",
              )}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleAlumno(s.uid)}
                    aria-label={`Seleccionar a ${s.displayName}`}
                    className="mt-1 size-4 shrink-0 rounded border-zinc-600"
                  />
                  <Link
                    href={`/coach/alumnos/${s.uid}`}
                    className="min-w-0 flex-1 transition hover:text-sky-300"
                  >
                    <p className="truncate font-medium">{s.displayName}</p>
                    <p className="truncate text-sm text-zinc-500">{s.email}</p>
                    {s.pendingVideos > 0 && (
                      <span className="mt-2 inline-block rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-medium text-sky-300">
                        {s.pendingVideos} vídeo{s.pendingVideos > 1 ? "s" : ""}{" "}
                        pendiente{s.pendingVideos > 1 ? "s" : ""}
                      </span>
                    )}
                  </Link>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2 pl-7 sm:pl-0">
                  <AlumnoLevelSelect
                    alumnoId={s.uid}
                    value={s.level}
                    compact
                    onChange={(level) => patchAlumnoLevel(s.uid, level)}
                  />
                  <Link
                    href={`/coach/alumnos/${s.uid}`}
                    className="rounded-full border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:border-sky-500/50"
                  >
                    Abrir
                  </Link>
                  <DeleteAlumnoButton
                    alumnoId={s.uid}
                    alumnoName={s.displayName}
                    alumnoEmail={s.email}
                    onDeleted={() => setRefreshKey((k) => k + 1)}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
