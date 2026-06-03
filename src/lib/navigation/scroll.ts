/** Altura aproximada del header sticky (scroll-margin / offset) */
export const SCROLL_HEADER_OFFSET = 80;

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function smoothScrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}

export function scrollToTop(options?: { behavior?: ScrollBehavior }) {
  if (typeof window === "undefined") return;
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: options?.behavior ?? smoothScrollBehavior(),
  });
}

export function scrollToElement(
  el: HTMLElement | null,
  options?: { behavior?: ScrollBehavior; block?: ScrollLogicalPosition },
) {
  if (!el || typeof window === "undefined") return;
  el.scrollIntoView({
    behavior: options?.behavior ?? smoothScrollBehavior(),
    block: options?.block ?? "start",
  });
}

export function scrollToId(
  id: string,
  options?: { behavior?: ScrollBehavior; block?: ScrollLogicalPosition },
) {
  const el = document.getElementById(id);
  scrollToElement(el, options);
}

const AUTH_GATE_ID = "booking-auth-gate";

/** Tras abrir el acceso en reservar: espera al montaje del panel y evita quedarse arriba. */
export function scrollToAuthGate(options?: {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  maxAttempts?: number;
  intervalMs?: number;
}) {
  if (typeof window === "undefined") return;
  const maxAttempts = options?.maxAttempts ?? 16;
  const intervalMs = options?.intervalMs ?? 50;
  let attempts = 0;

  const tryScroll = () => {
    const el = document.getElementById(AUTH_GATE_ID);
    if (el) {
      scrollToElement(el, {
        behavior: options?.behavior,
        block: options?.block ?? "start",
      });
      return;
    }
    attempts += 1;
    if (attempts < maxAttempts) {
      window.setTimeout(tryScroll, intervalMs);
    }
  };

  requestAnimationFrame(tryScroll);
}
