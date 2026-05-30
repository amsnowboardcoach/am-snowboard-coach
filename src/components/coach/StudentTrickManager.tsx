"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ensureTricksCatalog,
  mergeTricksWithProgress,
  setStudentTrickStatus,
} from "@/lib/firebase/tricks";
import type { TrickStatus, TrickWithProgress } from "@/types/tricks";
import { TRICK_CATEGORY_LABELS } from "@/constants/tricks-catalog";
import type { UserProfile } from "@/types/firestore";

const STATUSES: { id: TrickStatus; label: string }[] = [
  { id: "locked", label: "Bloqueado" },
  { id: "in_progress", label: "En progreso" },
  { id: "unlocked", label: "Desbloqueado" },
  { id: "mastered", label: "Dominado" },
];

interface StudentTrickManagerProps {
  student: UserProfile;
  coachId: string;
}

export function StudentTrickManager({
  student,
  coachId,
}: StudentTrickManagerProps) {
  const [tricks, setTricks] = useState<TrickWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureTricksCatalog();
      const data = await mergeTricksWithProgress(student.uid);
      setTricks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar trucos");
    } finally {
      setLoading(false);
    }
  }, [student.uid]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await ensureTricksCatalog();
        const data = await mergeTricksWithProgress(student.uid);
        if (active) setTricks(data);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Error al cargar trucos");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [student.uid]);

  async function updateStatus(trick: TrickWithProgress, status: TrickStatus) {
    setSaving(trick.id);
    setError(null);
    try {
      await setStudentTrickStatus(
        student.uid,
        trick,
        status,
        coachId,
        notes[trick.id],
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(null);
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
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {Object.entries(byCategory).map(([category, items]) => (
        <section key={category}>
          <h3 className="mb-3 text-sm font-semibold text-sky-400">
            {TRICK_CATEGORY_LABELS[category as keyof typeof TRICK_CATEGORY_LABELS]}
          </h3>
          <ul className="space-y-3">
            {items.map((trick) => {
              const current = trick.progress?.status ?? "locked";
              return (
                <li
                  key={trick.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{trick.name}</p>
                      <p className="text-xs text-zinc-500">{trick.description}</p>
                    </div>
                    <span className="text-xs text-zinc-600">
                      Dificultad {trick.difficulty}/5
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        disabled={saving === trick.id}
                        onClick={() => updateStatus(trick, s.id)}
                        className={`rounded-full px-3 py-1 text-xs ${
                          current === s.id
                            ? "bg-sky-500 text-zinc-950"
                            : "border border-zinc-700 text-zinc-400 hover:border-zinc-500"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <input
                    placeholder="Nota del coach (opcional)"
                    value={notes[trick.id] ?? trick.progress?.coachNotes ?? ""}
                    onChange={(e) =>
                      setNotes((n) => ({ ...n, [trick.id]: e.target.value }))
                    }
                    className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm"
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
