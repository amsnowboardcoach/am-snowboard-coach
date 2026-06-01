/** iPhone / iPad (Safari); en iOS las push web requieren app instalada en pantalla de inicio */
export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS 13+ a veces reporta «Macintosh»
  return (
    navigator.platform === "MacIntel" &&
    navigator.maxTouchPoints > 1 &&
    !/Android/i.test(ua)
  );
}

/** Safari en iOS (único navegador que permite «Añadir a pantalla de inicio» como PWA). */
export function isIosSafari(): boolean {
  if (!isIosDevice()) return false;
  const ua = navigator.userAgent;
  return (
    /Safari/i.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo/i.test(ua)
  );
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export function isAndroidDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

function ua(): string {
  return typeof navigator !== "undefined" ? navigator.userAgent : "";
}

/** WebViews (Instagram, Facebook, etc.) no permiten instalar PWA. */
export function isInAppBrowser(): boolean {
  const u = ua();
  return /FBAN|FBAV|Instagram|Twitter|Line\/|MicroMessenger|Snapchat|LinkedInApp/i.test(
    u,
  );
}

/** Navegador Android donde tiene sentido mostrar instalación (no WebViews). */
export function isAndroidInstallableBrowser(): boolean {
  return isAndroidDevice() && !isInAppBrowser();
}

/** Sitio público con barra inferior fija (no /coach, /perfil, /login) */
export function hasPublicMobileTabBar(pathname: string): boolean {
  if (pathname.startsWith("/coach")) return false;
  if (pathname.startsWith("/perfil")) return false;
  if (pathname.startsWith("/login")) return false;
  if (pathname.startsWith("/registro")) return false;
  return true;
}
