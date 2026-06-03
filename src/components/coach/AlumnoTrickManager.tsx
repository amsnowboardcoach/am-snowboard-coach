"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ensureTricksCatalog,
  mergeTricksWithProgress,
  resolveTrickStatus,
} from "@/lib/firebase/tricks";
import { publishAlumnoPassportChanges } from "@/lib/firebase/coach-alumno-actions";
import {
  fetchPassportSectionNotes,
  type PassportSectionNotesMap,
} from "@/lib/firebase/passport-section-notes";
import type { TrickCategory } from "@/constants/tricks-catalog";
import type { TrickStatus, TrickWithProgress } from "@/types/tricks";
import { TRICK_CATEGORY_LABELS } from "@/constants/tricks-catalog";
import type { UserProfile } from "@/types/firestore";

const STATUSES: { id: TrickStatus; label: string }[] = [
  { id: "locked", label: "Bloqueado" },
  { id: "in_progress", label: "En progreso" },
  { id: "unlocked", label: "Desbloqueado" },
  { id: "mastered", label: "Dominado" },
];

interface AlumnoTrickManagerProps {
  alumno: UserProfile;
}

function savedStatus(trick: TrickWithProgress): TrickStatus {
  return resolveTrickStatus(trick.progress);
}

function statusDraftDiffers(
  trick: TrickWithProgress,
  draftStatus: TrickStatus | undefined,
): boolean {
  if (draftStatus === undefined) return false;
  return draftStatus !== savedStatus(trick);
}

export function AlumnoTrickManager({ alumno }: AlumnoTrickManagerProps) {
  const [tricks, setTricks] = useState<TrickWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusDrafts, setStatusDrafts] = useState<
    Partial<Record<string, TrickStatus>>
  >({});
  const [savedSectionNotes, setSavedSectionNotes] =
    useState<PassportSectionNotesMap>({});
  const [sectionDrafts, setSectionDrafts] = useState<
    Partial<Record<TrickCategory, string>>
  >({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureTricksCatalog();
      const [data, sectionNotes] = await Promise.all([
        mergeTricksWithProgress(alumno.uid),
        fetchPassportSectionNotes(alumno.uid),
      ]);
      setTricks(data);
      setSavedSectionNotes(sectionNotes);
      setSectionDrafts({});
      setStatusDrafts({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar trucos");
    } finally {
      setLoading(false);
    }
  }, [alumno.uid]);

  useEffect(() => {
    load();
  }, [load]);

  const pendingTricks = useMemo(
    () =>
      tricks.filter((t) => statusDraftDiffers(t, statusDrafts[t.id])),
    [tricks, statusDrafts],
  );

  const pendingSectionCategories = useMemo(() => {
    const categories = new Set<TrickCategory>();
    for (const cat of Object.keys(TRICK_CATEGORY_LABELS) as TrickCategory[]) {
      const saved = (savedSectionNotes[cat] ?? "").trim();
      const draft = sectionDrafts[cat];
      const effective = draft !== undefined ? draft.trim() : saved;
      if (draft !== undefined && effective !== saved) {
        categories.add(cat);
      }
    }
    return categories;
  }, [savedSectionNotes, sectionDrafts]);

  const hasPending =
    pendingTricks.length > 0 || pendingSectionCategories.size > 0;

  function effectiveSectionNotes(category: TrickCategory): string {
    if (sectionDrafts[category] !== undefined) {
      return sectionDrafts[category]!;
    }
    return savedSectionNotes[category] ?? "";
  }

  function setSectionNotesDraft(category: TrickCategory, notes: string) {
    setSectionDrafts((prev) => {
      const saved = (savedSectionNotes[category] ?? "").trim();
      if (notes.trim() === saved) {
        const { [category]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [category]: notes };
    });
  }

  function effectiveStatus(trick: TrickWithProgress): TrickStatus {
    return statusDrafts[trick.id] ?? savedStatus(trick);
  }

  function setStatusDraft(trick: TrickWithProgress, status: TrickStatus) {
    setStatusDrafts((prev) => {
      if (status === savedStatus(trick)) {
        const { [trick.id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [trick.id]: status };
    });
  }

  function discardDrafts() {
    setStatusDrafts({});
    setSectionDrafts({});
    setError(null);
  }

  async function confirmAndNotify() {
    if (!hasPending) return;

    setPublishing(true);
    setError(null);
    try {
      await publishAlumnoPassportChanges(alumno.uid, {
        trickUpdates: pendingTricks.map((trick) => ({
          trickId: trick.id,
          trickName: trick.name,
          category: trick.category,
          sortOrder: trick.sortOrder,
          status: statusDrafts[trick.id]!,
        })),
        sectionNotes: [...pendingSectionCategories].map((category) => ({
          category,
          notes: effectiveSectionNotes(category),
        })),
      });
      setStatusDrafts({});
      setSectionDrafts({});
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al publicar cambios",
      );
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return <p className="text-zinc-500">Cargando pasaporte…</p>;
  }

  const byCategory = tricks.reduce(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    },
    {} as Record<string, TrickWithProgress[]>,
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-400">
        Marca el progreso de cada truco y escribe notas generales por sección.
        Los cambios no se publican hasta que pulses «Confirmar y notificar al
        alumno».
      </p>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {Object.entries(byCategory).map(([category, items]) => {
        const cat = category as TrickCategory;
        const sectionPending = pendingSectionCategories.has(cat);
        return (
          <section
            key={category}
            className={
              sectionPending
                ? "rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4"
                : ""
            }
          >
            <h3 className="mb-3 text-sm font-semibold text-sky-400">
              {TRICK_CATEGORY_LABELS[cat]}
              {sectionPending && (
                <span className="ml-2 text-xs font-normal text-amber-300">
                  · notas sin publicar
                </span>
              )}
            </h3>
            <label className="mb-4 block text-sm text-zinc-400">
              Notas de la sección (visibles para el alumno)
              <textarea
                rows={3}
                disabled={publishing}
                value={effectiveSectionNotes(cat)}
                onChange={(e) => setSectionNotesDraft(cat, e.target.value)}
                placeholder={`Objetivos, feedback general de ${TRICK_CATEGORY_LABELS[cat]}…`}
                className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 disabled:opacity-50"
              />
            </label>
            <ul className="space-y-3">
              {items.map((trick) => {
                const current = effectiveStatus(trick);
                const isPending = statusDraftDiffers(
                  trick,
                  statusDrafts[trick.id],
                );
                return (
                  <li
                    key={trick.id}
                    className={`rounded-xl border p-4 ${
                      isPending
                        ? "border-amber-500/40 bg-amber-500/5"
                        : "border-zinc-800 bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {trick.name}
                          {isPending && (
                            <span className="ml-2 text-xs font-normal text-amber-300">
                              · sin publicar
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {trick.description}
                        </p>
                      </div>
                      <span className="text-xs text-zinc-500">
                        Dificultad {trick.difficulty}/5
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {STATUSES.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          disabled={publishing}
                          onClick={() => setStatusDraft(trick, s.id)}
                          className={`rounded-full px-3 py-1 text-xs ${
                            current === s.id
                              ? "chip-toggle-active"
                              : "border border-zinc-700 text-zinc-400 hover:border-zinc-500"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {hasPending && (
        <div className="sticky bottom-4 z-10 rounded-2xl border border-amber-500/40 bg-zinc-950/95 p-4 shadow-lg backdrop-blur">
          <p className="text-sm text-amber-100">
            {pendingTricks.length + pendingSectionCategories.size} cambio
            {pendingTricks.length + pendingSectionCategories.size > 1
              ? "s"
              : ""}{" "}
            sin publicar — el alumno no los verá hasta que confirmes.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={publishing}
              onClick={discardDrafts}
              className="min-h-11 rounded-full border border-zinc-600 px-5 py-2.5 text-sm text-zinc-300 disabled:opacity-50"
            >
              Descartar
            </button>
            <button
              type="button"
              disabled={publishing}
              onClick={confirmAndNotify}
              className="min-h-11 flex-1 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 sm:flex-none"
            >
              {publishing
                ? "Publicando…"
                : "Confirmar y notificar al alumno"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
