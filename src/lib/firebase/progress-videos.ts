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
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase/client";
import type { ProgressVideo, ProgressVideoStatus } from "@/types/progress-video";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
const ALLOWED_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
];

function videosCol(studentId: string) {
  return collection(getFirebaseDb(), "users", studentId, "progress_videos");
}

export function validateVideoFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith("video/")) {
    return "Formato no válido. Usa MP4, MOV o WebM.";
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return "El vídeo no puede superar 100 MB.";
  }
  if (file.size < 1024) {
    return "El archivo está vacío o es demasiado pequeño.";
  }
  return null;
}

export async function uploadStudentProgressVideo(
  studentId: string,
  file: File,
  title?: string,
): Promise<string> {
  const err = validateVideoFile(file);
  if (err) throw new Error(err);

  const safeName = file.name.replace(/[^\w.\-() ]/g, "_").slice(0, 120);
  const videoRef = doc(videosCol(studentId));
  const storagePath = `progress_videos/${studentId}/${videoRef.id}/${safeName}`;

  const storageRef = ref(getFirebaseStorage(), storagePath);
  await uploadBytes(storageRef, file, { contentType: file.type });

  await setDoc(videoRef, {
    studentId,
    title: title?.trim() || safeName.replace(/\.[^.]+$/, "") || "Mi vídeo",
    storagePath,
    fileName: safeName,
    contentType: file.type,
    sizeBytes: file.size,
    status: "pending_review" satisfies ProgressVideoStatus,
    coachNotes: "",
    uploadedAt: serverTimestamp(),
  });

  return videoRef.id;
}

export async function fetchStudentProgressVideos(
  studentId: string,
): Promise<ProgressVideo[]> {
  const q = query(videosCol(studentId), orderBy("uploadedAt", "desc"));
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
  studentId: string,
  videoId: string,
  coachNotes: string,
): Promise<void> {
  const trimmed = coachNotes.trim();
  await updateDoc(doc(getFirebaseDb(), "users", studentId, "progress_videos", videoId), {
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
