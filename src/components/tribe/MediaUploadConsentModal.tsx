"use client";

import { useState } from "react";
import {
  TRIBE_UPLOAD_LEGAL_BODY,
  TRIBE_UPLOAD_LEGAL_CHECKBOX,
  TRIBE_UPLOAD_LEGAL_TITLE,
} from "@/constants/tribe-legal";

interface MediaUploadConsentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function MediaUploadConsentModal({
  open,
  onClose,
  onConfirm,
}: MediaUploadConsentModalProps) {
  const [accepted, setAccepted] = useState(false);

  if (!open) return null;

  function handleClose() {
    setAccepted(false);
    onClose();
  }

  function handleConfirm() {
    if (!accepted) return;
    setAccepted(false);
    onConfirm();
  }

  return (
    <div
      className="fixed inset-0 z-[62] flex items-end justify-center bg-black/70 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tribe-legal-title"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-xl">
        <h2 id="tribe-legal-title" className="text-lg font-semibold text-sky-300">
          {TRIBE_UPLOAD_LEGAL_TITLE}
        </h2>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
          {TRIBE_UPLOAD_LEGAL_BODY}
        </p>
        <label className="mt-6 flex cursor-pointer gap-3 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-zinc-600"
          />
          <span>{TRIBE_UPLOAD_LEGAL_CHECKBOX}</span>
        </label>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!accepted}
            className="rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-40"
          >
            Elegir archivo
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-zinc-600 px-6 py-2.5 text-sm text-zinc-300 hover:border-zinc-500"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
