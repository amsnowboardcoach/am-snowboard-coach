"use client";

import { useId } from "react";
import { cn } from "@/lib/utils/cn";

interface MobileFilePickerProps {
  accept: string;
  disabled?: boolean;
  loading?: boolean;
  label: string;
  loadingLabel?: string;
  hint?: string;
  selectedName?: string | null;
  onFileSelected: (file: File) => void | Promise<void>;
  className?: string;
}

/** Input superpuesto (mejor en iOS/Android que `display:none`). */
export function MobileFilePicker({
  accept,
  disabled,
  loading,
  label,
  loadingLabel = "Subiendo…",
  hint,
  selectedName,
  onFileSelected,
  className,
}: MobileFilePickerProps) {
  const inputId = useId();

  return (
    <div className={className}>
      <label
        htmlFor={inputId}
        className={cn(
          "btn-primary-md relative cursor-pointer",
          (disabled || loading) && "pointer-events-none opacity-50",
        )}
      >
        {loading ? loadingLabel : label}
        <input
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled || loading}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) void onFileSelected(file);
          }}
        />
      </label>
      {hint && <p className="mt-2 text-xs text-zinc-500">{hint}</p>}
      {selectedName && (
        <p className="mt-2 text-sm text-zinc-500">
          Archivo: <span className="text-zinc-200">{selectedName}</span>
        </p>
      )}
    </div>
  );
}
