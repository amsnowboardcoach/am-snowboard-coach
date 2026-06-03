"use client";

import { useEffect, useState } from "react";
import { countUnreadCoachNotices } from "@/lib/firebase/coach-notices";
import { cn } from "@/lib/utils/cn";

export function AlumnoNoticesUnreadBadge({
  alumnoId,
  className,
}: {
  alumnoId: string;
  className?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    void countUnreadCoachNotices(alumnoId).then((n) => {
      if (active) setCount(n);
    });
    return () => {
      active = false;
    };
  }, [alumnoId]);

  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-sky-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-zinc-950",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
