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
      <div className="modal-panel">
        <h2 id="tribe-legal-title" className="text-lg font-semibold text-sky-600">
          {TRIBE_UPLOAD_LEGAL_TITLE}
        </h2>
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-400">
          {TRIBE_UPLOAD_LEGAL_BODY}
        </p>
        <label className="mt-6 flex cursor-pointer gap-3 text-sm text-zinc-400">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-zinc-400"
          />
          <span>{TRIBE_UPLOAD_LEGAL_CHECKBOX}</span>
        </label>
        <div className="btn-row mt-6">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!accepted}
            className="btn-primary-md disabled:opacity-40"
          >
            Elegir archivo
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="btn-outline btn-inline"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
