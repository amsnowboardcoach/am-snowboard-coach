"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { COACH_ROLES } from "@/constants/roles";
import {
  isPushSupported,
  requestPushPermissionAndToken,
  subscribeForegroundMessages,
} from "@/lib/firebase/messaging-client";
import { cn } from "@/lib/utils/cn";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALL_BANNER_DISMISSED_KEY = "am-coach-pwa-install-dismissed";
const PUSH_BANNER_DISMISSED_KEY = "am-coach-pwa-push-dismissed";

function readInstallBannerDismissed(): boolean {
  try {
    return localStorage.getItem(INSTALL_BANNER_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function persistInstallBannerDismissed(): void {
  try {
    localStorage.setItem(INSTALL_BANNER_DISMISSED_KEY, "1");
  } catch {
    /* storage bloqueado */
  }
}

export function PwaShell() {
  const { user, profile, loading } = useAuth();
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(true);
  const [installed, setInstalled] = useState(false);
  const [pushBanner, setPushBanner] = useState(false);
  const [pushDismissed, setPushDismissed] = useState(true);
  const [pushLoading, setPushLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isCoach = profile && COACH_ROLES.includes(profile.role);

  useEffect(() => {
    setInstallDismissed(readInstallBannerDismissed());
    try {
      setPushDismissed(localStorage.getItem(PUSH_BANNER_DISMISSED_KEY) === "1");
    } catch {
      setPushDismissed(false);
    }
    setInstalled(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone ===
          true,
    );

    const onInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onInstall);
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);

  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;
    (async () => {
      const ok = await isPushSupported();
      if (cancelled || !ok) return;
      if (
        Notification.permission === "default" &&
        localStorage.getItem(PUSH_BANNER_DISMISSED_KEY) !== "1"
      ) {
        setPushBanner(true);
      } else if (Notification.permission === "granted") {
        await requestPushPermissionAndToken(user.uid);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  useEffect(() => {
    const unsub = subscribeForegroundMessages((title, body, url) => {
      setToast(`${title}: ${body}`);
      if (url && isCoach) {
        /* usuario puede pulsar toast visual */
      }
    });
    return () => {
      unsub?.();
    };
  }, [isCoach]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  function dismissInstallBanner() {
    persistInstallBannerDismissed();
    setInstallDismissed(true);
    setInstallEvent(null);
  }

  async function installApp() {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === "accepted") {
      setInstallEvent(null);
      setInstalled(true);
    } else if (outcome === "dismissed") {
      dismissInstallBanner();
    }
  }

  async function enablePush() {
    if (!user) return;
    setPushLoading(true);
    try {
      await requestPushPermissionAndToken(user.uid);
      setPushBanner(false);
      setToast("Notificaciones activadas");
    } catch {
      setToast("No se pudieron activar las notificaciones");
    } finally {
      setPushLoading(false);
    }
  }

  function dismissPushBanner() {
    try {
      localStorage.setItem(PUSH_BANNER_DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
    setPushDismissed(true);
    setPushBanner(false);
  }

  const showInstall = installEvent && !installed && !installDismissed;
  const showPush = pushBanner && user && !pushDismissed;

  if (!showInstall && !showPush && !toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[55] flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
      {toast && (
        <div className="pointer-events-auto max-w-md rounded-xl border border-sky-500/40 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 shadow-xl">
          {toast}
        </div>
      )}

      {showInstall && (
        <div className="pointer-events-auto flex w-full max-w-md flex-col gap-3 rounded-2xl border border-sky-500/40 bg-zinc-900 p-4 shadow-2xl sm:flex-row sm:items-center">
          <div className="flex-1 text-sm">
            <p className="font-semibold text-zinc-100">
              Instala la app en tu móvil
            </p>
            <p className="mt-1 text-zinc-400">
              Acceso rápido al panel y notificaciones al instante.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
            <button
              type="button"
              onClick={installApp}
              className="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-zinc-950"
            >
              Instalar
            </button>
            <button
              type="button"
              onClick={dismissInstallBanner}
              className={cn(
                "rounded-full border border-zinc-600 px-5 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-300",
              )}
            >
              No, gracias
            </button>
          </div>
        </div>
      )}

      {showPush && (
        <div className="pointer-events-auto flex w-full max-w-md flex-col gap-3 rounded-2xl border border-amber-500/40 bg-zinc-900 p-4 shadow-2xl sm:flex-row sm:items-center">
          <div className="flex-1 text-sm">
            <p className="font-semibold text-zinc-100">
              {isCoach
                ? "Activa avisos de reservas y vídeos"
                : "Activa avisos de tus clases"}
            </p>
            <p className="mt-1 text-zinc-400">
              {isCoach
                ? "Te aviso al instante cuando llegue una solicitud, un pago o un vídeo nuevo."
                : "Te aviso cuando confirme tu clase, al pagar o cuando publique tu corrección de vídeo."}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={dismissPushBanner}
              className={cn(
                "rounded-full border border-zinc-600 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-300",
              )}
            >
              No, gracias
            </button>
            <button
              type="button"
              disabled={pushLoading}
              onClick={enablePush}
              className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
            >
              {pushLoading ? "…" : "Activar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
