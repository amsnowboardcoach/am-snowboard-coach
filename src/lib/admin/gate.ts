export const ADMIN_GATE_COOKIE = "am_admin_gate";
export const ADMIN_GATE_MAX_AGE_SEC = 60 * 60 * 24; // 24 h

export function getAdminGatePassword(): string {
  return process.env.ADMIN_GATE_PASSWORD?.trim() || "alecoach";
}
