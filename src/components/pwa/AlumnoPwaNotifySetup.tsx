"use client";

import Link from "next/link";
import { useState } from "react";
import { LEGAL_PATHS } from "@/constants/legal-site";
import { isStandaloneDisplay } from "@/lib/pwa/device";
import {
  dismissAlumnoNotifySetup,
  markAlumnoNotifyConsent,
  markAlumnoNotifySetupComplete,
} from "@/lib/pwa/alumno-notify-setup";
import { cn } from "@/lib/utils/cn";

interface AlumnoPwaNotifySetupProps {
  aboveTabBar: boolean;
  installed: boolean;
  isIos: boolean;
  iosSafari: boolean;
  inAppBrowser: boolean;
  androidInstallBrowser: boolean;
  nativeInstallReady: boolean;
  installLoading: boolean;
  pushLoading: boolean;
  onNativeInstall: () => Promise<void>;
  onEnablePush: () => Promise<boolean>;
  onToast: (message: string) => void;
  onDismiss: () => void;
}

export function AlumnoPwaNotifySetup({
  aboveTabBar,
  installed,
  isIos,
  iosSafari,
  inAppBrowser,
  androidInstallBrowser,
  nativeInstallReady,
  installLoading,
  pushLoading,
  onNativeInstall,
  onEnablePush,
  onToast,
  onDismiss,
}: AlumnoPwaNotifySetupProps) {
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const needsIosInstall = isIos && !installed;
  const showInAppHint = inAppBrowser && !installed;
  const showIosWrongBrowser = isIos && !iosSafari && !installed && !showInAppHint;
  const canNativeInstall =
    !installed && androidInstallBrowser && nativeInstallReady && !showInAppHint;

  const primaryLabel = needsIosInstall
    ? "Entendido"
    : canNativeInstall
      ? "Instalar y activar avisos"
      : busy || installLoading || pushLoading
        ? "…"
        : "Activar avisos";

  async function handlePrimary() {
    if (!consent) {
      onToast("Marca la casilla de aceptación para continuar.");
      return;
    }

    markAlumnoNotifyConsent();

    if (showInAppHint) {
      onToast(
        "Abre esta página en Chrome o Safari (menú ⋮ → «Abrir en navegador») para instalar la app.",
      );
      return;
    }

    if (showIosWrongBrowser) {
      onToast(
        "En iPhone usa Safari: Compartir → «Añadir a pantalla de inicio». Luego vuelve aquí y activa los avisos.",
      );
      return;
    }

    setBusy(true);
    try {
      if (canNativeInstall) {
        await onNativeInstall();
      }

      if (isIos && !isStandaloneDisplay()) {
        onToast(
          "Cuando hayas añadido AM Coach a la pantalla de inicio, abre la app desde el icono y pulsa de nuevo «Activar avisos».",
        );
        return;
      }

      const ok = await onEnablePush();
      if (ok && Notification.permission === "granted") {
        markAlumnoNotifySetupComplete();
        onToast("App y avisos listos. Te avisaremos de tus clases y novedades.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-[55] flex justify-center px-4 pt-2",
        aboveTabBar
          ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]"
          : "bottom-0 pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
      )}
    >
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-sky-500/40 bg-zinc-900 p-4 shadow-2xl">
        <p className="text-sm font-semibold text-zinc-100">
          Instala la app para no perderte nada
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Añade <strong className="font-medium text-zinc-200">AM Coach</strong> a
          tu móvil y activa los avisos. Te llegará un mensaje cuando Alejandro
          confirme tu clase, haya cambios en tu pasaporte de trucos o publique la
          corrección de un vídeo.
        </p>

        {needsIosInstall && iosSafari && (
          <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-zinc-500">
            <li>Safari → Compartir (cuadrado con flecha)</li>
            <li>«Añadir a pantalla de inicio»</li>
            <li>Abre AM Coach desde el icono del móvil</li>
            <li>Vuelve aquí y pulsa «Activar avisos»</li>
          </ol>
        )}

        {androidInstallBrowser && !installed && !nativeInstallReady && (
          <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-zinc-500">
            <li>Menú ⋮ → «Instalar aplicación»</li>
            <li>O «Añadir a pantalla de inicio»</li>
          </ol>
        )}

        <label className="mt-4 flex cursor-pointer items-start gap-3 text-left">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 size-4 shrink-0 rounded border-zinc-600 bg-zinc-950 text-sky-500 focus:ring-sky-500/40"
          />
          <span className="text-xs leading-relaxed text-zinc-400">
            Acepto instalar o usar la app web como aplicación, recibir
            notificaciones push en este dispositivo y el almacenamiento técnico
            necesario (service worker y token de avisos) según la{" "}
            <Link
              href={LEGAL_PATHS.privacy}
              className="text-sky-400 underline hover:text-sky-300"
            >
              política de privacidad
            </Link>{" "}
            y la{" "}
            <Link
              href={LEGAL_PATHS.cookies}
              className="text-sky-400 underline hover:text-sky-300"
            >
              política de cookies
            </Link>
            .
          </span>
        </label>

        <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
          <button
            type="button"
            disabled={busy || installLoading || pushLoading}
            onClick={() => void handlePrimary()}
            className="btn-primary-md min-h-11 w-full max-w-none disabled:opacity-50 sm:flex-1"
          >
            {primaryLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              dismissAlumnoNotifySetup();
              onDismiss();
            }}
            className="btn-outline btn-inline min-h-11 w-full sm:w-auto"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
