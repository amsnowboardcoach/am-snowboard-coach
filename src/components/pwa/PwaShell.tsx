"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { COACH_ROLES } from "@/constants/roles";
import {
  isPushConfigured,
  isPushSupported,
  requestPushPermissionAndToken,
  subscribeForegroundMessages,
  warmMessagingServiceWorker,
} from "@/lib/firebase/messaging-client";
import {
  hasPublicMobileTabBar,
  isIosDevice,
  isStandaloneDisplay,
} from "@/lib/pwa/device";
import { cn } from "@/lib/utils/cn";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALL_BANNER_DISMISSED_KEY = "am-coach-pwa-install-dismissed";
const PUSH_BANNER_DISMISSED_KEY = "am-coach-pwa-push-dismissed";

type ToastState = { message: string; url?: string } | null;

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
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { user, profile, loading } = useAuth();
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(true);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [pushBanner, setPushBanner] = useState(false);
  const [pushDismissed, setPushDismissed] = useState(true);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushConfigured, setPushConfigured] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const isCoach = profile && COACH_ROLES.includes(profile.role);
  const aboveTabBar = hasPublicMobileTabBar(pathname);

  useEffect(() => {
    setInstallDismissed(readInstallBannerDismissed());
    try {
      setPushDismissed(localStorage.getItem(PUSH_BANNER_DISMISSED_KEY) === "1");
    } catch {
      setPushDismissed(false);
    }
    setInstalled(isStandaloneDisplay());
    setIsIos(isIosDevice());
    setPushConfigured(isPushConfigured());

    if (isPushConfigured()) {
      void warmMessagingServiceWorker();
    }

    const onInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (loading || !user || !pushConfigured) return;
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
        await requestPushPermissionAndToken(user.uid).catch(() => null);
      }
    })().catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [user, loading, pushConfigured]);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let cancelled = false;
    void isPushSupported().then((ok) => {
      if (cancelled || !ok) return;
      unsub =
        subscribeForegroundMessages((title, body, url) => {
          setToast({
            message: body ? `${title}: ${body}` : title,
            url,
          });
        }) ?? null;
    });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
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
    if (isIos && !isStandaloneDisplay()) {
      setToast({
        message:
          "En iPhone: instala la app en la pantalla de inicio (Compartir → Añadir) y luego activa los avisos.",
      });
      return;
    }
    setPushLoading(true);
    try {
      const token = await requestPushPermissionAndToken(user.uid);
      if (token) {
        setPushBanner(false);
        setToast({ message: "Notificaciones activadas en este dispositivo" });
      } else if (Notification.permission === "denied") {
        setToast({
          message:
            "Permiso denegado. Actívalo en Ajustes del navegador → Notificaciones.",
        });
      } else {
        setToast({ message: "No se pudieron activar las notificaciones" });
      }
    } catch {
      setToast({ message: "No se pudieron activar las notificaciones" });
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

  const showAndroidInstall =
    Boolean(installEvent) && !installed && !installDismissed;
  const showIosInstall =
    isIos && !installed && !installDismissed && !showAndroidInstall;
  const showInstall = showAndroidInstall || showIosInstall;
  const showPush =
    pushBanner && user && !pushDismissed && pushConfigured && !showInstall;

  if (!showInstall && !showPush && !toast) return null;

  const installTitle = isCoach
    ? "Instala la app del coach"
    : user
      ? "Instala tu área de alumno"
      : "Instala AM Snowboard Coach";

  const installBody = showIosInstall
    ? "En Safari: botón Compartir → «Añadir a pantalla de inicio». Así abres más rápido y en iPhone puedes recibir avisos."
    : isCoach
      ? "Acceso directo al panel, reservas y avisos al instante."
      : "Acceso rápido a reservas, tu perfil y avisos cuando confirme tu clase.";

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-[55] flex flex-col items-center gap-2 px-4 pt-2",
        aboveTabBar
          ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]"
          : "bottom-0 pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
      )}
    >
      {toast && (
        <button
          type="button"
          onClick={() => {
            if (toast.url) router.push(toast.url);
            setToast(null);
          }}
          className="pointer-events-auto max-w-md rounded-xl border border-sky-500/40 bg-zinc-900 px-4 py-3 text-left text-sm text-zinc-100 shadow-xl active:bg-zinc-800"
        >
          {toast.message}
          {toast.url && (
            <span className="mt-1 block text-xs text-sky-400">Toca para abrir</span>
          )}
        </button>
      )}

      {showInstall && (
        <div className="pointer-events-auto flex w-full max-w-md flex-col gap-3 rounded-2xl border border-sky-500/40 bg-zinc-900 p-4 shadow-2xl sm:flex-row sm:items-center">
          <div className="flex-1 text-sm">
            <p className="font-semibold text-zinc-100">{installTitle}</p>
            <p className="mt-1 text-zinc-400">{installBody}</p>
            {showIosInstall && (
              <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-xs text-zinc-500">
                <li>Toca Compartir (cuadrado con flecha)</li>
                <li>«Añadir a pantalla de inicio»</li>
                <li>Abre la app desde el icono AM</li>
              </ol>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
            {showAndroidInstall && (
              <button
                type="button"
                onClick={installApp}
                className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950"
              >
                Instalar
              </button>
            )}
            {showIosInstall && (
              <button
                type="button"
                onClick={dismissInstallBanner}
                className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950"
              >
                Entendido
              </button>
            )}
            <button
              type="button"
              onClick={dismissInstallBanner}
              className="rounded-full border border-zinc-600 px-5 py-2.5 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
            >
              {showIosInstall ? "Ahora no" : "No, gracias"}
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
                : "Te aviso cuando acepte tu clase, al pagar o cuando publique tu corrección de vídeo."}
            </p>
            {isIos && !installed && (
              <p className="mt-2 text-xs text-amber-200/90">
                En iPhone, instala la app en la pantalla de inicio para que las
                notificaciones funcionen.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={dismissPushBanner}
              className="rounded-full border border-zinc-600 px-4 py-2.5 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
            >
              No, gracias
            </button>
            <button
              type="button"
              disabled={pushLoading}
              onClick={enablePush}
              className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
            >
              {pushLoading ? "…" : "Activar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
