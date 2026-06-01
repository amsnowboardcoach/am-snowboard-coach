"use client";

import { useMemo, useState } from "react";
import {
  COACH_BROADCAST_TEMPLATES,
  type CoachBroadcastTemplateId,
  findCoachBroadcastTemplate,
} from "@/constants/coach-student-messages";
import { sendCoachStudentBroadcast } from "@/lib/firebase/coach-broadcast";
import { cn } from "@/lib/utils/cn";

interface CoachStudentBroadcastPanelProps {
  selectedIds: string[];
  onClearSelection?: () => void;
}

export function CoachStudentBroadcastPanel({
  selectedIds,
  onClearSelection,
}: CoachStudentBroadcastPanelProps) {
  const [templateId, setTemplateId] =
    useState<CoachBroadcastTemplateId>("station_closed");
  const [customTitle, setCustomTitle] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [sendPush, setSendPush] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (templateId === "custom") {
      return {
        title: customTitle.trim() || "Tu título",
        body: customBody.trim() || "Tu mensaje…",
      };
    }
    const t = findCoachBroadcastTemplate(templateId);
    return {
      title: t?.title ?? "",
      body: t?.body ?? "",
    };
  }, [templateId, customTitle, customBody]);

  async function handleSend() {
    if (selectedIds.length === 0) {
      setError("Selecciona al menos un alumno.");
      return;
    }

    const label =
      templateId === "custom"
        ? "mensaje personalizado"
        : findCoachBroadcastTemplate(templateId)?.label ?? "aviso";

    if (
      !confirm(
        `¿Enviar «${label}» a ${selectedIds.length} alumno${selectedIds.length > 1 ? "s" : ""}?\n\nPush: ${sendPush ? "sí" : "no"} · Email: ${sendEmail ? "sí" : "no"}`,
      )
    ) {
      return;
    }

    setSending(true);
    setError(null);
    setFeedback(null);

    try {
      const result = await sendCoachStudentBroadcast({
        studentIds: selectedIds,
        templateId,
        customTitle: templateId === "custom" ? customTitle : undefined,
        customBody: templateId === "custom" ? customBody : undefined,
        sendPush,
        sendEmail,
      });

      const failed = result.failedCount ?? 0;
      setFeedback(
        failed > 0
          ? `Enviado a ${result.sent} de ${result.total} alumnos (${failed} sin entrega completa).`
          : `Aviso enviado a ${result.sent} alumno${result.sent > 1 ? "s" : ""}.`,
      );
      onClearSelection?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6">
      <h3 className="text-base font-semibold text-zinc-100">
        Avisos a alumnos
      </h3>
      <p className="mt-1 text-sm text-zinc-500">
        Mensajes predefinidos (estación cerrada, retraso, etc.) por push y email a
        los alumnos que marques abajo.
      </p>

      <div className="mt-4">
        <label
          htmlFor="broadcast-template"
          className="text-xs font-medium uppercase tracking-wide text-zinc-500"
        >
          Plantilla
        </label>
        <select
          id="broadcast-template"
          value={templateId}
          onChange={(e) =>
            setTemplateId(e.target.value as CoachBroadcastTemplateId)
          }
          className="mt-1.5 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100"
        >
          {COACH_BROADCAST_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
          <option value="custom">Mensaje personalizado</option>
        </select>
      </div>

      {templateId === "custom" && (
        <div className="mt-4 space-y-3">
          <label className="block text-sm text-zinc-400">
            Título del aviso
            <input
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              maxLength={100}
              placeholder="Ej. Cambio de horario de clase"
              className="mt-1 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
            />
          </label>
          <label className="block text-sm text-zinc-400">
            Mensaje
            <textarea
              value={customBody}
              onChange={(e) => setCustomBody(e.target.value)}
              maxLength={800}
              rows={4}
              placeholder="Escribe el texto que verán en el móvil y el email…"
              className="mt-1 w-full resize-y rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-zinc-100"
            />
          </label>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Vista previa
        </p>
        <p className="mt-2 font-semibold text-zinc-100">{preview.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-zinc-400">
          {preview.body}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-300">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={sendPush}
            onChange={(e) => setSendPush(e.target.checked)}
            className="size-4 rounded border-zinc-600"
          />
          Push (móvil / PWA)
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="size-4 rounded border-zinc-600"
          />
          Email
        </label>
      </div>

      <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={sending || selectedIds.length === 0}
          className={cn(
            "min-h-11 w-full max-w-none px-6 py-2.5 text-sm font-semibold sm:min-w-[14rem] sm:flex-none",
            selectedIds.length === 0
              ? "btn-secondary cursor-not-allowed opacity-60"
              : "btn-primary-md",
          )}
        >
          {sending
            ? "Enviando…"
            : selectedIds.length === 0
              ? "Selecciona alumnos"
              : `Enviar a ${selectedIds.length} alumno${selectedIds.length > 1 ? "s" : ""}`}
        </button>
        {selectedIds.length > 0 && onClearSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            className="text-sm text-zinc-500 hover:text-zinc-300"
          >
            Quitar selección
          </button>
        )}
      </div>

      {feedback && (
        <p className="mt-3 text-sm text-emerald-400" role="status">
          {feedback}
        </p>
      )}
      {error && (
        <p className="mt-3 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
