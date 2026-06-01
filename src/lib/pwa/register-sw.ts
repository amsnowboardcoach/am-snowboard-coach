/** Service worker principal (PWA + push). Sin query en la URL (requerido en móvil). */
export const PWA_SW_VERSION = "v5";
export const PWA_SERVICE_WORKER_PATH = "/sw.js";

export async function registerPwaServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const existing = await navigator.serviceWorker.getRegistration("/");
    if (existing) {
      const scriptUrl =
        existing.active?.scriptURL ??
        existing.waiting?.scriptURL ??
        existing.installing?.scriptURL ??
        "";
      const isOurWorker =
        scriptUrl.includes("/sw.js") &&
        !scriptUrl.includes("firebase-messaging") &&
        !scriptUrl.includes("sw.js?");
      if (scriptUrl && (!isOurWorker || scriptUrl.includes("sw.js?"))) {
        await existing.unregister();
      }
    }

    const registration = await navigator.serviceWorker.register(
      PWA_SERVICE_WORKER_PATH,
      { scope: "/", updateViaCache: "none" },
    );
    await registration.update();
    return registration;
  } catch (err) {
    console.warn("[pwa] No se pudo registrar el service worker:", err);
    return null;
  }
}
