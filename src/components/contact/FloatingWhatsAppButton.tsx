"use client";

import {
  COACH_WHATSAPP_PREFILL_DEFAULT,
  getCoachWhatsAppUrl,
} from "@/constants/coach-contact";
import { WhatsAppIcon } from "@/components/contact/WhatsAppIcon";
import { cn } from "@/lib/utils/cn";

interface FloatingWhatsAppButtonProps {
  /** Sitio público con barra inferior en móvil */
  aboveMobileNav?: boolean;
  prefill?: string;
  className?: string;
}

export function FloatingWhatsAppButton({
  aboveMobileNav = false,
  prefill = COACH_WHATSAPP_PREFILL_DEFAULT,
  className,
}: FloatingWhatsAppButtonProps) {
  const href = getCoachWhatsAppUrl(prefill);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar con Alejandro por WhatsApp"
      title="WhatsApp — reservas y dudas"
      className={cn(
        "fixed z-50 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-950/40 ring-2 ring-white/10 transition hover:scale-105 hover:brightness-110 active:scale-95",
        aboveMobileNav
          ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-4 sm:bottom-6"
          : "bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-4 sm:bottom-6",
        className,
      )}
    >
      <WhatsAppIcon size={28} />
    </a>
  );
}
