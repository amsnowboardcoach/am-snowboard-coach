import {
  type StorageReference,
  type UploadTaskSnapshot,
  uploadBytes,
  uploadBytesResumable,
} from "firebase/storage";
import { inferFileContentType } from "@/lib/utils/media-file";

const RESUMABLE_THRESHOLD_BYTES = 8 * 1024 * 1024;

function uploadProgressPercent(snap: UploadTaskSnapshot): number {
  if (snap.totalBytes <= 0) return 0;
  return Math.min(100, Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
}

export async function uploadUserFile(
  storageRef: StorageReference,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const contentType = inferFileContentType(file);
  const metadata = { contentType };

  if (!onProgress && file.size < RESUMABLE_THRESHOLD_BYTES) {
    await uploadBytes(storageRef, file, metadata);
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, metadata);
    task.on(
      "state_changed",
      (snap) => onProgress?.(uploadProgressPercent(snap)),
      (err) => reject(err),
      () => {
        onProgress?.(100);
        resolve();
      },
    );
  });
}

export function mapStorageUploadError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code === "storage/unauthorized") {
    return "No tienes permiso para subir. Cierra sesión, vuelve a entrar como alumno e inténtalo de nuevo.";
  }
  if (code === "storage/canceled") {
    return "Subida cancelada.";
  }
  if (code === "storage/quota-exceeded") {
    return "Almacenamiento lleno. Contacta con el coach.";
  }
  if (code === "storage/retry-limit-exceeded") {
    return "La conexión falló. Prueba con Wi‑Fi o un archivo más pequeño.";
  }
  if (code === "storage/invalid-checksum") {
    return "El archivo se corrompió al subir. Vuelve a elegirlo.";
  }
  return err instanceof Error ? err.message : "Error al subir el archivo";
}
