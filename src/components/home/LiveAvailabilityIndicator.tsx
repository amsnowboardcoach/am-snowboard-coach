"use client";

import { cn } from "@/lib/utils/cn";

type LiveAvailabilityIndicatorProps = {
  syncing: boolean;
  error?: boolean;
  className?: string;
};

/** Punto verde en vivo; rojo mientras sincroniza o si hay error. */
export function LiveAvailabilityIndicator({
  syncing,
  error = false,
  className,
}: LiveAvailabilityIndicatorProps) {
  const live = !syncing && !error;

  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      role="status"
      aria-live="polite"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
        {(live || syncing) && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-70 motion-safe:animate-ping",
              syncing || error ? "bg-red-400" : "bg-emerald-400",
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            syncing || error ? "bg-red-500" : "bg-emerald-500",
            live && "motion-safe:animate-pulse",
          )}
        />
      </span>
      <span className="text-xs font-medium text-zinc-400">
        Disponibilidad en vivo
      </span>
      <span className="sr-only">
        {syncing
          ? "Actualizando calendario"
          : error
            ? "Error al cargar disponibilidad"
            : "Calendario sincronizado"}
      </span>
    </span>
  );
}
