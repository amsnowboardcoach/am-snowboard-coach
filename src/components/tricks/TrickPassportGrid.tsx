"use client";

import { TRICK_CATEGORY_LABELS } from "@/constants/tricks-catalog";
import type { TrickCategory } from "@/constants/tricks-catalog";
import type { PassportSectionNotesMap } from "@/lib/firebase/passport-section-notes";
import type { TrickStatus, TrickWithProgress } from "@/types/tricks";

const statusConfig: Record<
  TrickStatus,
  { label: string; className: string; icon: string }
> = {
  locked: {
    label: "Bloqueado",
    className: "border-zinc-800 bg-zinc-900/40 opacity-60",
    icon: "🔒",
  },
  in_progress: {
    label: "En progreso",
    className: "border-amber-500/40 bg-amber-500/10",
    icon: "🎯",
  },
  unlocked: {
    label: "Desbloqueado",
    className: "border-sky-500/40 bg-sky-500/10",
    icon: "✓",
  },
  mastered: {
    label: "Dominado",
    className: "border-emerald-500/40 bg-emerald-500/10",
    icon: "★",
  },
};

interface TrickPassportGridProps {
  tricks: TrickWithProgress[];
  showCoachNotes?: boolean;
  sectionNotes?: PassportSectionNotesMap;
}

export function TrickPassportGrid({
  tricks,
  showCoachNotes = true,
  sectionNotes = {},
}: TrickPassportGridProps) {
  const byCategory = tricks.reduce(
    (acc, trick) => {
      if (!acc[trick.category]) acc[trick.category] = [];
      acc[trick.category].push(trick);
      return acc;
    },
    {} as Record<string, TrickWithProgress[]>,
  );

  const unlocked = tricks.filter(
    (t) =>
      t.progress?.status === "unlocked" ||
      t.progress?.status === "mastered" ||
      t.progress?.status === "in_progress",
  ).length;

  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-400">
        {unlocked} de {tricks.length} maniobras desbloqueadas
      </p>

      {Object.entries(byCategory).map(([category, items]) => {
        const cat = category as TrickCategory;
        const sectionNote = sectionNotes[cat]?.trim();
        return (
        <section key={category}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-sky-400">
            {TRICK_CATEGORY_LABELS[cat]}
          </h3>
          {sectionNote && (
            <p className="mb-4 rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-sm text-sky-100/90">
              <span className="font-medium text-sky-300">Notas del coach: </span>
              {sectionNote}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((trick) => {
              const status = trick.progress?.status ?? "locked";
              const cfg = statusConfig[status];
              return (
                <article
                  key={trick.id}
                  className={`rounded-xl border p-4 ${cfg.className}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-lg" aria-hidden>
                      {cfg.icon}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {"★".repeat(trick.difficulty)}
                    </span>
                  </div>
                  <h4 className="mt-2 font-semibold">{trick.name}</h4>
                  <p className="mt-1 text-xs text-zinc-500">{trick.description}</p>
                  <p className="mt-3 text-xs font-medium text-zinc-400">
                    {cfg.label}
                  </p>
                  {showCoachNotes && trick.progress?.coachNotes && (
                    <p className="mt-2 text-xs italic text-sky-300/80">
                      Coach: {trick.progress.coachNotes}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      );
      })}
    </div>
  );
}
