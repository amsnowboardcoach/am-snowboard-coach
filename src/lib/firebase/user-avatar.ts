import { updateProfile } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { authPhotoURL } from "@/lib/auth/auth-photo";
import {
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
} from "@/lib/firebase/client";
import {
  mapStorageUploadError,
  uploadUserFile,
} from "@/lib/firebase/storage-upload";
import { isImageFile } from "@/lib/utils/media-file";

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export function validateAvatarFile(file: File): string | null {
  if (!isImageFile(file)) {
    return "Solo imágenes (JPG, PNG o WebP).";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return "La foto puede pesar hasta 5 MB.";
  }
  return null;
}

export async function uploadUserAvatar(
  userId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const validationError = validateAvatarFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const ext = file.name.match(/\.[a-z0-9]+$/i)?.[0]?.toLowerCase() || ".jpg";
  const storagePath = `avatars/${userId}/profile-${Date.now()}${ext}`;
  const storageRef = ref(getFirebaseStorage(), storagePath);

  try {
    await uploadUserFile(storageRef, file, onProgress);
  } catch (err) {
    throw new Error(mapStorageUploadError(err));
  }

  const photoURL = await getDownloadURL(storageRef);

  await updateDoc(doc(getFirebaseDb(), "users", userId), {
    photoURL,
    avatarSource: "custom",
    updatedAt: serverTimestamp(),
  });

  const authUser = getFirebaseAuth().currentUser;
  if (authUser?.uid === userId) {
    await updateProfile(authUser, { photoURL });
  }

  return photoURL;
}

/** Vuelve a la foto de la cuenta de Google (si está vinculada). */
export async function restoreGoogleProfilePhoto(userId: string): Promise<string | null> {
  const authUser = getFirebaseAuth().currentUser;
  if (!authUser || authUser.uid !== userId) {
    throw new Error("Debes tener la sesión iniciada.");
  }

  const googlePhoto = authPhotoURL(authUser);
  if (!googlePhoto) {
    throw new Error("Tu cuenta de Google no tiene foto de perfil.");
  }

  await updateDoc(doc(getFirebaseDb(), "users", userId), {
    photoURL: googlePhoto,
    avatarSource: "google",
    updatedAt: serverTimestamp(),
  });

  await updateProfile(authUser, { photoURL: googlePhoto });

  return googlePhoto;
}
