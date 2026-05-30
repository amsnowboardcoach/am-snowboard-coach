"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AdminGateModal } from "@/components/layout/AdminGateModal";

/** Mantén pulsado el logo ~0,7 s para abrir acceso coach (oculto). Un toque = inicio. */
const LONG_PRESS_MS = 700;

export function SiteHeaderLogo() {
  const [gateOpen, setGateOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handlePointerDown() {
    longPressTriggered.current = false;
    clearLongPress();
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setGateOpen(true);
    }, LONG_PRESS_MS);
  }

  function handlePointerEnd() {
    clearLongPress();
  }

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (longPressTriggered.current) {
      e.preventDefault();
      longPressTriggered.current = false;
    }
  }

  return (
    <>
      <Link
        href="/"
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onContextMenu={(e) => e.preventDefault()}
        className="touch-manipulation text-lg font-bold tracking-tight transition hover:opacity-90 select-none"
        aria-label="AM Snowboard Coach — inicio"
      >
        AM <span className="text-sky-400">Snowboard</span>
        <span className="hidden font-normal text-zinc-500 sm:inline"> Coach</span>
      </Link>
      <AdminGateModal open={gateOpen} onClose={() => setGateOpen(false)} />
    </>
  );
}
