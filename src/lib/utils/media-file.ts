const EXT_TO_MIME: Record<string, string> = {
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".m4v": "video/mp4",
  ".avi": "video/x-msvideo",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

/** iOS/Android a veces dejan `file.type` vacío; inferir por extensión. */
export function inferFileContentType(file: File): string {
  const raw = file.type?.trim();
  if (raw && raw !== "application/octet-stream") {
    return raw;
  }
  const ext = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0];
  if (ext && EXT_TO_MIME[ext]) {
    return EXT_TO_MIME[ext];
  }
  return raw || "application/octet-stream";
}

export function isVideoFile(file: File): boolean {
  return inferFileContentType(file).startsWith("video/");
}

export function isImageFile(file: File): boolean {
  return inferFileContentType(file).startsWith("image/");
}

export function fileExtension(name: string): string {
  return name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
}
