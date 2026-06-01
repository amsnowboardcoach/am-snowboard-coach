import { getFirebaseAuthHeaders } from "@/lib/auth/firebase-auth-headers";
import type { TribeMediaType } from "@/types/tribe-post";

export class TribeUploadApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "TribeUploadApiError";
    this.status = status;
    this.code = code;
  }
}

/** Sube vía API (Admin SDK); evita reglas de Storage en el cliente. */
export async function uploadTribePostThroughApi(input: {
  file: File;
  mediaType: TribeMediaType;
  caption?: string;
  legalConsent: boolean;
  onUploadProgress?: (percent: number) => void;
}): Promise<string> {
  const form = new FormData();
  form.append("file", input.file);
  form.append("mediaType", input.mediaType);
  form.append("legalConsent", input.legalConsent ? "true" : "false");
  if (input.caption?.trim()) {
    form.append("caption", input.caption.trim());
  }

  const headers = await getFirebaseAuthHeaders();
  if (!("Authorization" in headers)) {
    throw new TribeUploadApiError(
      "Sesión caducada. Vuelve a iniciar sesión e inténtalo de nuevo.",
      401,
    );
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/tribe/upload");
    xhr.responseType = "json";

    if (input.onUploadProgress && xhr.upload) {
      xhr.upload.addEventListener("progress", (event) => {
        if (!event.lengthComputable) return;
        const percent = Math.min(
          100,
          Math.round((event.loaded / event.total) * 100),
        );
        input.onUploadProgress?.(percent);
      });
    }

    xhr.addEventListener("load", () => {
      const body = xhr.response as { postId?: string; error?: string; code?: string } | null;
      if (xhr.status >= 200 && xhr.status < 300 && body?.postId) {
        input.onUploadProgress?.(100);
        resolve(body.postId);
        return;
      }
      reject(
        new TribeUploadApiError(
          body?.error ||
            "No se pudo subir la publicación. Comprueba tu conexión e inténtalo de nuevo.",
          xhr.status,
          body?.code,
        ),
      );
    });

    xhr.addEventListener("error", () => {
      reject(
        new TribeUploadApiError(
          "Error de red al subir. Prueba con Wi‑Fi o un archivo más pequeño.",
          0,
        ),
      );
    });

    xhr.addEventListener("abort", () => {
      reject(new TribeUploadApiError("Subida cancelada.", 0));
    });

    for (const [key, value] of Object.entries(headers)) {
      if (typeof value === "string") {
        xhr.setRequestHeader(key, value);
      }
    }
    xhr.send(form);
  });
}

export function shouldFallbackToClientTribeUpload(err: unknown): boolean {
  if (!(err instanceof TribeUploadApiError)) return false;
  return err.status === 413 || err.code === "payload_too_large";
}
