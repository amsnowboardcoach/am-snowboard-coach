"use client";

import { cn } from "@/lib/utils/cn";

export function CoachHubTabBadge({
  count,
  className,
  pulse = false,
}: {
  count: number;
  className?: string;
  /** Pulso en pestaña activa con pendientes (reservas). */
  pulse?: boolean;
}) {
  if (count <= 0) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className={cn(
        "inline-flex min-w-[1.125rem] shrink-0 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-zinc-950 tabular-nums",
        pulse && "animate-pulse",
        className,
      )}
      aria-label={`${count} pendiente${count === 1 ? "" : "s"}`}
    >
      {label}
    </span>
  );
}
