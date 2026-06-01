"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { COACH_ROLES, isAlumnoRole, ROLES } from "@/constants/roles";
import {
  isPushConfigured,
  isPushSupported,
  requestPushPermissionAndToken,
  subscribeForegroundMessages,
} from "@/lib/firebase/messaging-client";
import {
  hasPublicMobileTabBar,
  isAndroidDevice,
  isAndroidInstallableBrowser,
  isInAppBrowser,
  isIosDevice,
  isIosSafari,
  isStandaloneDisplay,
} from "@/lib/pwa/device";
import {
  bindBeforeInstallPromptListener,
  subscribeInstallPrompt,
  triggerNativePwaInstall,
} from "@/lib/pwa/install-prompt";
import { registerPwaServiceWorker } from "@/lib/pwa/register-sw";
import {
  hasStudentNotifyConsent,
  isStudentNotifySetupComplete,
  isStudentNotifySetupDismissed,
  markStudentNotifySetupComplete,
} from "@/lib/pwa/student-notify-setup";
import { StudentPwaNotifySetup } from "@/components/pwa/StudentPwaNotifySetup";
import { cn } from "@/lib/utils/cn";

const PWA_INSTALLED_KEY = "am-coach-pwa-installed";
const PUSH_BANNER_DISMISSED_KEY = "am-coach-pwa-push-dismissed";

type ToastState = { message: string; url?: string } | null;

function markPwaInstalled(): void {
  try {
    localStorage.setItem(PWA_INSTALLED_KEY, "1");
  } catch {
    /* ignore */
  }
}

function isPwaInstalled(): boolean {
  if (isStandaloneDisplay()) return true;
  try {
    return localStorage.getItem(PWA_INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function PwaShell() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const { user, profile, loading } = useAuth();
  const [installDismissed, setInstallDismissed] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [iosSafari, setIosSafari] = useState(false);
  const [androidInstallBrowser, setAndroidInstallBrowser] = useState(false);
  const [nativeInstallReady, setNativeInstallReady] = useState(false);
  const [installLoading, setInstallLoading] = useState(false);
  const [pushBanner, setPushBanner] = useState(false);
  const [pushDismissed, setPushDismissed] = useState(true);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushConfigured, setPushConfigured] = useState(false);
  const [studentSetupDismissed, setStudentSetupDismissed] = useState(false);
  const [studentSetupComplete, setStudentSetupComplete] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const isCoach = profile && COACH_ROLES.includes(profile.role);
  const isStudent = profile?.role ? isAlumnoRole(profile.role) : false;
  const aboveTabBar = hasPublicMobileTabBar(pathname);

  useEffect(() => {
    void registerPwaServiceWorker();

    try {
      localStorage.removeItem("am-coach-pwa-install-dismissed");
    } catch {
      /* clave antigua */
    }

    try {
      setPushDismissed(localStorage.getItem(PUSH_BANNER_DISMISSED_KEY) === "1");
    } catch {
      setPushDismissed(false);
    }

    setStudentSetupDismissed(isStudentNotifySetupDismissed());
    setStudentSetupComplete(isStudentNotifySetupComplete());

    const alreadyInstalled = isPwaInstalled();
    if (alreadyInstalled) markPwaInstalled();
    setInstalled(alreadyInstalled);
    setInstallDismissed(false);
    setIsIos(isIosDevice());
    setIsAndroid(isAndroidDevice());
    setInAppBrowser(isInAppBrowser());
    setIosSafari(isIosSafari());
    setAndroidInstallBrowser(isAndroidInstallableBrowser());
    setPushConfigured(isPushConfigured());

    const onInstalled = () => {
      markPwaInstalled();
      setInstalled(true);
      setInstallDismissed(true);
      setNativeInstallReady(false);
    };

    const unbindPrompt = bindBeforeInstallPromptListener();
    const unsubPrompt = subscribeInstallPrompt(setNativeInstallReady);

    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("appinstalled", onInstalled);
      unbindPrompt();
      unsubPrompt();
    };
  }, []);

  useEffect(() => {
    if (loading || !user || !pushConfigured) return;
    let cancelled = false;
    (async () => {
      const ok = await isPushSupported();
      if (cancelled || !ok) return;

      if (Notification.permission === "granted") {
        await requestPushPermissionAndToken(user.uid).catch(() => null);
        if (isStudent) {
          markStudentNotifySetupComplete();
          setStudentSetupComplete(true);
        }
        return;
      }

      const coachUser = profile && COACH_ROLES.includes(profile.role);
      if (coachUser) {
        if (Notification.permission === "default") {
          setPushBanner(true);
        }
        return;
      }

      if (isStudent && !isStudentNotifySetupDismissed()) {
        const iosNeedsInstall = isIosDevice() && !isPwaInstalled();
        if (
          Notification.permission === "default" ||
          iosNeedsInstall ||
          hasStudentNotifyConsent()
        ) {
          if (!isStudentNotifySetupComplete()) {
            setStudentSetupComplete(false);
          }
        }
      } else {
        const dismissed =
          localStorage.getItem(PUSH_BANNER_DISMISSED_KEY) === "1";
        if (Notification.permission === "default" && !dismissed) {
          setPushBanner(true);
        }
      }
    })().catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [user, profile, loading, pushConfigured, isStudent]);

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
    setInstallDismissed(true);
  }

  function showInstallInstructions() {
    if (inAppBrowser) {
      setToast({
        message:
          "Abre esta página en Chrome o Safari (menú ⋮ → «Abrir en navegador») para instalar la app.",
      });
      return;
    }
    if (isIos && !iosSafari) {
      setToast({
        message:
          "En iPhone usa Safari: Compartir → «Añadir a pantalla de inicio». Chrome en iOS no instala apps.",
      });
      return;
    }
    setToast({
      message: isIos
        ? "Safari: Compartir → «Añadir a pantalla de inicio»."
        : "Chrome: menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».",
    });
  }

  async function handleNativeInstall() {
    setInstallLoading(true);
    try {
      const outcome = await triggerNativePwaInstall();
      if (outcome === "accepted") {
        markPwaInstalled();
        setInstalled(true);
        setInstallDismissed(true);
        setToast({ message: "App instalada correctamente" });
      } else if (outcome === "unavailable") {
        showInstallInstructions();
      }
    } finally {
      setInstallLoading(false);
    }
  }

  async function enablePush(): Promise<boolean> {
    if (!user) return false;
    if (isIos && !isStandaloneDisplay()) {
      setToast({
        message:
          "En iPhone: instala la app en la pantalla de inicio (Safari → Compartir → Añadir) y luego activa los avisos.",
      });
      return false;
    }
    setPushLoading(true);
    try {
      const token = await requestPushPermissionAndToken(user.uid);
      if (token) {
        setPushBanner(false);
        if (isStudent) {
          markStudentNotifySetupComplete();
          setStudentSetupComplete(true);
        }
        setToast({ message: "Notificaciones activadas en este dispositivo" });
        return true;
      }
      if (Notification.permission === "denied") {
        setToast({
          message:
            "Permiso denegado. Actívalo en Ajustes del navegador → Notificaciones.",
        });
      } else {
        setToast({ message: "No se pudieron activar las notificaciones" });
      }
      return false;
    } catch {
      setToast({ message: "No se pudieron activar las notificaciones" });
      return false;
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

  const showInAppHint = inAppBrowser && !installed && !installDismissed;
  const showAndroidInstall =
    isAndroid &&
    androidInstallBrowser &&
    !installed &&
    !installDismissed &&
    !showInAppHint;
  const showIosInstall =
    isIos && iosSafari && !installed && !installDismissed && !showInAppHint;
  const showIosWrongBrowser =
    isIos && !iosSafari && !installed && !installDismissed && !showInAppHint;
  const showInstall =
    !isStudent &&
    (showInAppHint || showAndroidInstall || showIosInstall || showIosWrongBrowser);
  const showPush =
    pushBanner &&
    user &&
    pushConfigured &&
    !showInstall &&
    isCoach;
  const studentNeedsIosInstall = isStudent && isIos && !installed;
  const showStudentNotifySetup =
    isStudent &&
    user &&
    pushConfigured &&
    !loading &&
    !studentSetupDismissed &&
    !studentSetupComplete &&
    (studentNeedsIosInstall ||
      Notification.permission === "default" ||
      (hasStudentNotifyConsent() && Notification.permission !== "granted"));

  if (!showInstall && !showPush && !showStudentNotifySetup && !toast) {
    return null;
  }

  const installTitle = isCoach
    ? "Instala la app del coach"
    : user
      ? "Instala tu área de alumno"
      : "Instala AM Snowboard Coach";

  const installBody = showInAppHint
    ? "Estás en una app de redes sociales. Abre el enlace en Chrome o Safari para poder instalar AM Coach."
    : showIosWrongBrowser
      ? "En iPhone solo Safari permite instalar la app. Abre esta web en Safari y usa Compartir → «Añadir a pantalla de inicio»."
      : showIosInstall
        ? "En Safari: botón Compartir → «Añadir a pantalla de inicio». Así abres más rápido y en iPhone puedes recibir avisos."
        : nativeInstallReady
          ? "Pulsa «Instalar ahora» para añadir AM Coach a tu pantalla de inicio."
          : "Cuando aparezca la opción, usa «Instalar ahora». Si no, menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».";

  return (
    <>
      {showStudentNotifySetup && (
        <StudentPwaNotifySetup
          aboveTabBar={aboveTabBar}
          installed={installed}
          isIos={isIos}
          iosSafari={iosSafari}
          inAppBrowser={inAppBrowser}
          androidInstallBrowser={androidInstallBrowser}
          nativeInstallReady={nativeInstallReady}
          installLoading={installLoading}
          pushLoading={pushLoading}
          onNativeInstall={handleNativeInstall}
          onEnablePush={enablePush}
          onToast={(message) => setToast({ message })}
          onDismiss={() => setStudentSetupDismissed(true)}
        />
      )}

      {toast && (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[56] flex justify-center px-4",
            showStudentNotifySetup
              ? "bottom-[calc(14rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(12rem+env(safe-area-inset-bottom,0px))]"
              : aboveTabBar
                ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]"
                : "bottom-0 pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
          )}
        >
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
        </div>
      )}

      {(showInstall || showPush) && (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-[55] flex flex-col items-center gap-2 px-4 pt-2",
        aboveTabBar
          ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]"
          : "bottom-0 pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
      )}
    >
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
            {showAndroidInstall && !nativeInstallReady && (
              <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-xs text-zinc-500">
                <li>Menú ⋮ (tres puntos arriba a la derecha)</li>
                <li>«Instalar aplicación» o «Añadir a pantalla de inicio»</li>
              </ol>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-stretch">
            {showAndroidInstall && (
              <button
                type="button"
                disabled={installLoading}
                onClick={() => void handleNativeInstall()}
                className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
              >
                {installLoading
                  ? "…"
                  : nativeInstallReady
                    ? "Instalar ahora"
                    : "Cómo instalar"}
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
            {(showInAppHint || showIosWrongBrowser) && (
              <button
                type="button"
                onClick={showInstallInstructions}
                className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950"
              >
                Ver pasos
              </button>
            )}
            <button
              type="button"
              onClick={dismissInstallBanner}
              className="rounded-full border border-zinc-600 px-5 py-2.5 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
            >
              Ahora no
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
            {!isCoach && (
              <button
                type="button"
                onClick={dismissPushBanner}
                className="rounded-full border border-zinc-600 px-4 py-2.5 text-sm text-zinc-400 hover:border-zinc-500 hover:text-zinc-300"
              >
                No, gracias
              </button>
            )}
            <button
              type="button"
              disabled={pushLoading}
              onClick={() => void enablePush()}
              className="rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-50"
            >
              {pushLoading ? "…" : "Activar"}
            </button>
          </div>
        </div>
      )}
    </div>
      )}
    </>
  );
}
