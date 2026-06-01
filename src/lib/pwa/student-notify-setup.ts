export const STUDENT_NOTIFY_DISMISSED_KEY = "am-student-notify-setup-dismissed";
export const STUDENT_NOTIFY_COMPLETE_KEY = "am-student-notify-setup-complete";
export const STUDENT_NOTIFY_CONSENT_KEY = "am-student-notify-consent";

export function isStudentNotifySetupDismissed(): boolean {
  try {
    return localStorage.getItem(STUDENT_NOTIFY_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function isStudentNotifySetupComplete(): boolean {
  try {
    return localStorage.getItem(STUDENT_NOTIFY_COMPLETE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markStudentNotifySetupComplete(): void {
  try {
    localStorage.setItem(STUDENT_NOTIFY_COMPLETE_KEY, "1");
    localStorage.removeItem(STUDENT_NOTIFY_DISMISSED_KEY);
  } catch {
    /* ignore */
  }
}

export function dismissStudentNotifySetup(): void {
  try {
    localStorage.setItem(STUDENT_NOTIFY_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasStudentNotifyConsent(): boolean {
  try {
    return localStorage.getItem(STUDENT_NOTIFY_CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function markStudentNotifyConsent(): void {
  try {
    localStorage.setItem(STUDENT_NOTIFY_CONSENT_KEY, "1");
  } catch {
    /* ignore */
  }
}
