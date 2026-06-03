"use client";

import { useEffect, useState } from "react";
import { MobileFilePicker } from "@/components/ui/MobileFilePicker";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useAuth } from "@/contexts/AuthProvider";
import {
  hasCustomAvatar,
  resolvedProfilePhotoURL,
  usesGoogleSignIn,
} from "@/lib/auth/auth-photo";
import {
  restoreGoogleProfilePhoto,
  uploadUserAvatar,
} from "@/lib/firebase/user-avatar";

export function ProfilePhotoUpload() {
  const { user, profile, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const displayName =
    profile?.displayName || user?.displayName || "Alumno AM";
  const googleAccount = Boolean(user && usesGoogleSignIn(user));
  const customPhoto = hasCustomAvatar(profile);
  const photoURL = resolvedProfilePhotoURL(profile, user);

  useEffect(() => {
    if (!googleAccount || !user?.uid || customPhoto) return;
    void refreshProfile();
    // Sincroniza foto de Google en Firestore si aún no hay foto propia
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar / cambiar cuenta
  }, [googleAccount, user?.uid, customPhoto]);

  async function handleFileSelected(file: File) {
    if (!user?.uid) return;

    setUploading(true);
    setProgress(0);
    setError(null);
    setSuccess(null);

    try {
      await uploadUserAvatar(user.uid, file, setProgress);
      await refreshProfile();
      setSuccess("Foto actualizada. Se verá en La Tribu y el mercadillo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la foto");
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  async function handleRestoreGoogle() {
    if (!user?.uid || !googleAccount) return;

    setRestoring(true);
    setError(null);
    setSuccess(null);

    try {
      await restoreGoogleProfilePhoto(user.uid);
      await refreshProfile();
      setSuccess("Foto de Google restaurada.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo restaurar la foto",
      );
    } finally {
      setRestoring(false);
    }
  }

  const busy = uploading || restoring;

  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <UserAvatar
          photoURL={photoURL}
          displayName={displayName}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-zinc-100">
            Foto de perfil
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {googleAccount
              ? "Por defecto usamos tu foto de Google. Puedes subir otra para La Tribu y el mercadillo."
              : "Aparece en tus publicaciones de La Tribu y en tus anuncios del mercadillo."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <MobileFilePicker
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              disabled={!user?.uid || busy}
              loading={uploading}
              label={photoURL ? "Cambiar foto" : "Subir foto"}
              loadingLabel={
                progress !== null && progress < 100
                  ? `Subiendo… ${progress}%`
                  : "Guardando…"
              }
              hint="JPG, PNG o WebP · máximo 5 MB"
              onFileSelected={handleFileSelected}
            />
            {googleAccount && customPhoto && (
              <button
                type="button"
                disabled={busy || !user?.uid}
                onClick={() => void handleRestoreGoogle()}
                className="min-h-11 rounded-full border border-zinc-600 px-4 py-2.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
              >
                {restoring ? "Restaurando…" : "Usar foto de Google"}
              </button>
            )}
          </div>
          {success && (
            <p className="mt-3 text-sm text-emerald-400" role="status">
              {success}
            </p>
          )}
          {error && (
            <p className="mt-3 text-sm text-red-300" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
