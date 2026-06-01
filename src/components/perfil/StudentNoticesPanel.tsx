"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchStudentCoachNotices,
  markAllCoachNoticesRead,
  markCoachNoticeRead,
} from "@/lib/firebase/coach-notices";
import { formatFirestoreDate } from "@/lib/utils/dates";
import type { CoachNoticeDoc } from "@/types/coach-notice";
import { cn } from "@/lib/utils/cn";

interface StudentNoticesPanelProps {
  studentId: string;
  /** Vista compacta en perfil (solo los últimos). */
  compact?: boolean;
}

export function StudentNoticesPanel({
  studentId,
  compact = false,
}: StudentNoticesPanelProps) {
  const [notices, setNotices] = useState<CoachNoticeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchStudentCoachNotices(studentId, compact ? 3 : 50);
      setNotices(list);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar los avisos",
      );
    } finally {
      setLoading(false);
    }
  }, [studentId, compact]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleOpen(notice: CoachNoticeDoc) {
    if (notice.readAt) return;
    try {
      await markCoachNoticeRead(studentId, notice.id);
      await load();
    } catch {
      /* ignore */
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllCoachNoticesRead(studentId, notices);
      await load();
    } catch {
      /* ignore */
    }
  }

  const unread = notices.filter((n) => !n.readAt).length;
  const visible = compact ? notices.slice(0, 3) : notices;

  if (loading) {
    return (
      <p className="text-sm text-zinc-500">
        {compact ? "Cargando avisos…" : "Cargando avisos del coach…"}
      </p>
    );
  }

  if (error) {
    return (
      <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
        {error}
      </p>
    );
  }

  if (visible.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 px-4 py-8 text-center text-sm text-zinc-500">
        {compact
          ? "Sin avisos recientes del coach."
          : "Aún no tienes avisos. Cuando Alejandro envíe un aviso (estación cerrada, retraso, etc.), aparecerá aquí."}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {!compact && unread > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-400">
            {unread} sin leer
          </p>
          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="text-sm font-medium link-accent"
          >
            Marcar todos como leídos
          </button>
        </div>
      )}

      <ul className="space-y-3">
        {visible.map((notice) => {
          const isUnread = !notice.readAt;
          return (
            <li key={notice.id}>
              <article
                className={cn(
                  "rounded-2xl border p-5 transition",
                  isUnread
                    ? "border-sky-500/35 bg-sky-500/10"
                    : "border-zinc-800 bg-zinc-900/40",
                )}
                onClick={() => void handleOpen(notice)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    void handleOpen(notice);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-sky-400/90">
                    {notice.templateLabel ?? "Aviso del coach"}
                  </p>
                  <time
                    className="text-xs text-zinc-500"
                    dateTime={notice.createdAt?.toDate?.()?.toISOString()}
                  >
                    {formatFirestoreDate(notice.createdAt)}
                  </time>
                </div>
                <h3 className="mt-2 font-semibold text-zinc-100">
                  {notice.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {notice.body}
                </p>
                {isUnread && (
                  <p className="mt-3 text-xs font-medium text-sky-300">
                    Nuevo
                  </p>
                )}
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
