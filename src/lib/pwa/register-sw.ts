/** Service worker principal (PWA + push). Debe registrarse siempre, no solo con VAPID. */
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
      if (scriptUrl && !scriptUrl.includes("/sw.js")) {
        await existing.unregister();
      } else if (existing.active) {
        return existing;
      }
    }

    return await navigator.serviceWorker.register(PWA_SERVICE_WORKER_PATH, {
      scope: "/",
    });
  } catch (err) {
    console.warn("[pwa] No se pudo registrar el service worker:", err);
    return null;
  }
}
