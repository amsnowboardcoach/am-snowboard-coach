/** Evento `beforeinstallprompt` (Chrome / Edge en Android y escritorio). */
export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(available: boolean) => void>();

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredInstallPrompt;
}

export function subscribeInstallPrompt(
  listener: (available: boolean) => void,
): () => void {
  listeners.add(listener);
  listener(Boolean(deferredInstallPrompt));
  return () => listeners.delete(listener);
}

function notifyInstallPromptListeners(): void {
  const available = Boolean(deferredInstallPrompt);
  for (const listener of listeners) {
    listener(available);
  }
}

export function captureBeforeInstallPrompt(event: Event): void {
  event.preventDefault();
  deferredInstallPrompt = event as BeforeInstallPromptEvent;
  notifyInstallPromptListeners();
}

export function clearDeferredInstallPrompt(): void {
  deferredInstallPrompt = null;
  notifyInstallPromptListeners();
}

export async function triggerNativePwaInstall(): Promise<
  "accepted" | "dismissed" | "unavailable"
> {
  const promptEvent = deferredInstallPrompt;
  if (!promptEvent) return "unavailable";

  await promptEvent.prompt();
  const { outcome } = await promptEvent.userChoice;
  clearDeferredInstallPrompt();
  return outcome;
}

export function bindBeforeInstallPromptListener(): () => void {
  if (typeof window === "undefined") return () => {};

  const handler = (event: Event) => captureBeforeInstallPrompt(event);
  window.addEventListener("beforeinstallprompt", handler);
  return () => window.removeEventListener("beforeinstallprompt", handler);
}
