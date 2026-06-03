export const ALUMNO_NOTIFY_DISMISSED_KEY = "am-student-notify-setup-dismissed";
export const ALUMNO_NOTIFY_COMPLETE_KEY = "am-student-notify-setup-complete";
export const ALUMNO_NOTIFY_CONSENT_KEY = "am-student-notify-consent";

export function isAlumnoNotifySetupDismissed(): boolean {
  try {
    return localStorage.getItem(ALUMNO_NOTIFY_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function isAlumnoNotifySetupComplete(): boolean {
  try {
    return localStorage.getItem(ALUMNO_NOTIFY_COMPLETE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markAlumnoNotifySetupComplete(): void {
  try {
    localStorage.setItem(ALUMNO_NOTIFY_COMPLETE_KEY, "1");
    localStorage.removeItem(ALUMNO_NOTIFY_DISMISSED_KEY);
  } catch {
    /* ignore */
  }
}

export function dismissAlumnoNotifySetup(): void {
  try {
    localStorage.setItem(ALUMNO_NOTIFY_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasAlumnoNotifyConsent(): boolean {
  try {
    return localStorage.getItem(ALUMNO_NOTIFY_CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function markAlumnoNotifyConsent(): void {
  try {
    localStorage.setItem(ALUMNO_NOTIFY_CONSENT_KEY, "1");
  } catch {
    /* ignore */
  }
}
