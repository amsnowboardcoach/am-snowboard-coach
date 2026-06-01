"use client";

import { useEffect, useState } from "react";

/** true tras el primer paint en cliente (evita mismatch SSR con Auth/Firebase). */
export function useClientHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
