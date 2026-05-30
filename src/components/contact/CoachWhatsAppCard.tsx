"use client";

import {
  COACH_WHATSAPP_DISPLAY,
  COACH_WHATSAPP_STUDENT_INTRO,
  getCoachWhatsAppUrl,
} from "@/constants/coach-contact";
import { WhatsAppIcon } from "@/components/contact/WhatsAppIcon";
import { cn } from "@/lib/utils/cn";

interface CoachWhatsAppCardProps {
  className?: string;
  compact?: boolean;
  /** Mensaje precargado al abrir WhatsApp */
  prefill?: string;
  /** Texto introductorio; `null` = sin párrafo */
  intro?: string | null;
  /** Muestra el número en botón o pie (por defecto oculto) */
  showPhone?: boolean;
}

const WHATSAPP_BUTTON_CLASS =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition active:opacity-90 hover:brightness-110";

export function CoachWhatsAppCard({
  className,
  compact = false,
  prefill,
  intro,
  showPhone = false,
}: CoachWhatsAppCardProps) {
  const href = getCoachWhatsAppUrl(prefill);
  const introText =
    intro === undefined ? COACH_WHATSAPP_STUDENT_INTRO : intro;
  const buttonLabel = showPhone ? `WhatsApp · ${COACH_WHATSAPP_DISPLAY}` : "WhatsApp";

  if (compact) {
    return (
      <div className={cn(className)}>
        {introText && (
          <p className="text-sm text-zinc-400">{introText}</p>
        )}
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(WHATSAPP_BUTTON_CLASS, introText && "mt-3")}
        >
          <WhatsAppIcon />
          {buttonLabel}
        </a>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-emerald-500/35 bg-gradient-to-br from-emerald-500/10 to-zinc-900/50 p-6 sm:p-8",
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90">
            Contacto directo
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-100">
            WhatsApp con Alejandro
          </h2>
          {introText && (
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-400">
              {introText}
            </p>
          )}
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(WHATSAPP_BUTTON_CLASS, "min-h-12 px-6 py-3 text-base sm:self-center")}
        >
          <WhatsAppIcon />
          Abrir WhatsApp
        </a>
      </div>
      {showPhone && (
        <p className="mt-4 text-xs text-zinc-500">
          {COACH_WHATSAPP_DISPLAY} · Respuesta en horario de clase
        </p>
      )}
    </section>
  );
}

