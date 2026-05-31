/** iPhone / iPad (Safari); en iOS las push web requieren app instalada en pantalla de inicio */
export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

/** Sitio público con barra inferior fija (no /coach, /perfil, /login) */
export function hasPublicMobileTabBar(pathname: string): boolean {
  if (pathname.startsWith("/coach")) return false;
  if (pathname.startsWith("/perfil")) return false;
  if (pathname.startsWith("/login")) return false;
  if (pathname.startsWith("/registro")) return false;
  return true;
}
