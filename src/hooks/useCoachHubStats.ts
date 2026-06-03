"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchCoachHubStats,
  type CoachHubStats,
} from "@/lib/firebase/coach-hub-stats";

const POLL_MS = 60_000;

export function useCoachHubStats(coachId: string | undefined) {
  const [stats, setStats] = useState<CoachHubStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!coachId) {
      setStats(null);
      setLoading(false);
      return;
    }
    try {
      const next = await fetchCoachHubStats(coachId);
      setStats(next);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    setLoading(true);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!coachId) return;

    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    const interval = window.setInterval(() => void refresh(), POLL_MS);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.clearInterval(interval);
    };
  }, [coachId, refresh]);

  return { stats, loading, refresh };
}
