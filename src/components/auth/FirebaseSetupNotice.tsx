import { isFirebaseConfigured } from "@/lib/auth/config";

export function FirebaseSetupNotice() {
  if (isFirebaseConfigured()) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      Firebase no está configurado. Crea{" "}
      <code className="text-amber-100">.env.local</code> con las claves del
      proyecto. Guía en{" "}
      <span className="font-medium">docs/CHECKLIST.md</span>
      .
    </div>
  );
}
