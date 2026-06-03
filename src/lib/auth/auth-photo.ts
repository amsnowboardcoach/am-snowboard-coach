import type { User } from "firebase/auth";

/** Foto del proveedor Google o la del usuario Firebase Auth. */
export function authPhotoURL(user: User): string | undefined {
  const direct = user.photoURL?.trim();
  if (direct) return direct;

  const google = user.providerData.find((p) => p.providerId === "google.com");
  return google?.photoURL?.trim() || undefined;
}

export function usesGoogleSignIn(user: User): boolean {
  return user.providerData.some((p) => p.providerId === "google.com");
}

export function isUploadedAvatarUrl(url: string | undefined): boolean {
  if (!url?.trim()) return false;
  const u = url.trim();
  return (
    u.includes("firebasestorage.googleapis.com") ||
    u.includes("/avatars/")
  );
}

export function hasCustomAvatar(profile: {
  photoURL?: string;
  avatarSource?: string;
} | null | undefined): boolean {
  if (!profile) return false;
  if (profile.avatarSource === "custom") return true;
  return isUploadedAvatarUrl(profile.photoURL);
}

/** Foto mostrada en UI: Firestore primero, luego Auth (Google). */
export function resolvedProfilePhotoURL(
  profile: { photoURL?: string } | null | undefined,
  user: User | null | undefined,
): string | undefined {
  const fromProfile = profile?.photoURL?.trim();
  if (fromProfile) return fromProfile;
  return user ? authPhotoURL(user) : undefined;
}
