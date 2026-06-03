import {
  collection,
  deleteField,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase/client";
import {
  mapStorageUploadError,
  uploadUserFile,
} from "@/lib/firebase/storage-upload";
import { inferFileContentType, isVideoFile } from "@/lib/utils/media-file";
import type { ProgressVideo, ProgressVideoStatus } from "@/types/progress-video";

const MAX_VIDEO_BYTES = 200 * 1024 * 1024; // 200 MB (vídeos de móvil suelen ser grandes)

function videosCol(alumnoId: string) {
  return collection(getFirebaseDb(), "users", alumnoId, "progress_videos");
}

export function validateVideoFile(file: File): string | null {
  if (!isVideoFile(file)) {
    return "Formato no válido. Usa MP4, MOV o WebM desde la galería del móvil.";
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return "El vídeo no puede superar 200 MB. Graba en 1080p o acorta el clip.";
  }
  if (file.size < 1024) {
    return "El archivo está vacío o es demasiado pequeño.";
  }
  return null;
}

export async function uploadAlumnoProgressVideo(
  alumnoId: string,
  file: File,
  title?: string,
): Promise<string> {
  const err = validateVideoFile(file);
  if (err) throw new Error(err);

  const safeName = file.name.replace(/[^\w.\-() ]/g, "_").slice(0, 120);
  const videoRef = doc(videosCol(alumnoId));
  const storagePath = `progress_videos/${alumnoId}/${videoRef.id}/${safeName}`;

  const storageRef = ref(getFirebaseStorage(), storagePath);
  const contentType = inferFileContentType(file);
  try {
    await uploadUserFile(storageRef, file);
  } catch (err) {
    throw new Error(mapStorageUploadError(err));
  }

  await setDoc(videoRef, {
    alumnoId,
    title: title?.trim() || safeName.replace(/\.[^.]+$/, "") || "Mi vídeo",
    storagePath,
    fileName: safeName,
    contentType,
    sizeBytes: file.size,
    status: "pending_review" satisfies ProgressVideoStatus,
    coachNotes: "",
    uploadedAt: serverTimestamp(),
  });

  return videoRef.id;
}

export async function fetchAlumnoProgressVideos(
  alumnoId: string,
): Promise<ProgressVideo[]> {
  const q = query(videosCol(alumnoId), orderBy("uploadedAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as ProgressVideo,
  );
}

export async function getProgressVideoDownloadUrl(
  storagePath: string,
): Promise<string> {
  return getDownloadURL(ref(getFirebaseStorage(), storagePath));
}

export async function saveCoachVideoNotes(
  alumnoId: string,
  videoId: string,
  coachNotes: string,
): Promise<void> {
  const trimmed = coachNotes.trim();
  await updateDoc(doc(getFirebaseDb(), "users", alumnoId, "progress_videos", videoId), {
    coachNotes: trimmed,
    status: trimmed ? ("reviewed" satisfies ProgressVideoStatus) : "pending_review",
    coachNotesUpdatedAt: serverTimestamp(),
    reviewedAt: trimmed ? serverTimestamp() : deleteField(),
  });
}

export function formatVideoSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
