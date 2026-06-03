"use client";

import { useState } from "react";
import {
  BOOKING_LEVEL_OPTIONS,
  alumnoLevelLabel,
} from "@/lib/booking/contact-notes";
import { updateCoachAlumnoLevel } from "@/lib/firebase/coach-alumno-level";
import type { UserProfile } from "@/types/firestore";
import { cn } from "@/lib/utils/cn";

interface AlumnoLevelSelectProps {
  alumnoId: string;
  value: UserProfile["level"];
  onChange?: (level: UserProfile["level"]) => void;
  className?: string;
  compact?: boolean;
}

export function AlumnoLevelSelect({
  alumnoId,
  value,
  onChange,
  className,
  compact = false,
}: AlumnoLevelSelectProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(next: string) {
    const level =
      next === ""
        ? null
        : (next as NonNullable<UserProfile["level"]>);

    setSaving(true);
    setError(null);
    try {
      await updateCoachAlumnoLevel(alumnoId, level);
      onChange?.(level ?? undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {!compact && (
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Nivel
        </span>
      )}
      <select
        value={value ?? ""}
        onChange={(e) => void handleChange(e.target.value)}
        disabled={saving}
        aria-label="Nivel del alumno"
        className={cn(
          "rounded-lg border border-zinc-700 bg-zinc-950 text-zinc-100 transition",
          compact
            ? "min-h-9 px-2.5 py-1.5 text-xs"
            : "min-h-10 w-full max-w-[11rem] px-3 py-2 text-sm",
          saving && "opacity-60",
        )}
      >
        <option value="">Sin definir</option>
        {BOOKING_LEVEL_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
      {saving && (
        <span className="text-[11px] text-zinc-500">Guardando…</span>
      )}
      {error && (
        <span className="text-[11px] text-red-300" role="alert">
          {error}
        </span>
      )}
      {!compact && !saving && !error && (
        <span className="text-[11px] text-zinc-500">
          Actual: {alumnoLevelLabel(value)}
        </span>
      )}
    </div>
  );
}
