import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { COACH_ROLES } from "@/constants/roles";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase/client";
import {
  mapStorageUploadError,
  uploadUserFile,
} from "@/lib/firebase/storage-upload";
import { isImageFile, isVideoFile } from "@/lib/utils/media-file";
import type { UserRole } from "@/constants/roles";
import type {
  TribeComment,
  TribeMediaType,
  TribeModerationStatus,
  TribePost,
} from "@/types/tribe-post";

const POSTS = "tribe_posts";
const MAX_PHOTO_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function postsCol() {
  return collection(getFirebaseDb(), POSTS);
}

function moderationForRole(role: UserRole): TribeModerationStatus {
  return COACH_ROLES.includes(role) ? "approved" : "pending";
}

export function validateTribeMediaFile(
  file: File,
  mediaType: TribeMediaType,
): string | null {
  if (mediaType === "photo") {
    if (!isImageFile(file)) {
      return "Selecciona una imagen (JPG, PNG, HEIC o WebP).";
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return "La imagen no puede superar 12 MB.";
    }
  } else {
    if (!isVideoFile(file)) {
      return "Selecciona un vídeo (MP4 o MOV desde la galería).";
    }
    if (file.size > MAX_VIDEO_BYTES) {
      return "El vídeo no puede superar 100 MB.";
    }
  }
  if (file.size < 512) {
    return "El archivo está vacío o es demasiado pequeño.";
  }
  return null;
}

export async function uploadTribePost(input: {
  authorId: string;
  authorDisplayName: string;
  authorPhotoURL?: string;
  authorRole: UserRole;
  file: File;
  mediaType: TribeMediaType;
  caption?: string;
  legalConsent: boolean;
}): Promise<string> {
  if (!input.legalConsent) {
    throw new Error("Debes aceptar las condiciones de publicación.");
  }

  const err = validateTribeMediaFile(input.file, input.mediaType);
  if (err) throw new Error(err);

  const postRef = doc(postsCol());
  const safeName = input.file.name.replace(/[^\w.\-() ]/g, "_").slice(0, 120);
  const storagePath = `tribe/${postRef.id}/${safeName}`;
  const storageRef = ref(getFirebaseStorage(), storagePath);

  try {
    await uploadUserFile(storageRef, input.file);
  } catch (err) {
    throw new Error(mapStorageUploadError(err));
  }
  const mediaUrl = await getDownloadURL(storageRef);

  await setDoc(postRef, {
    authorId: input.authorId,
    authorDisplayName: input.authorDisplayName.trim() || "Alumno AM",
    authorPhotoURL: input.authorPhotoURL ?? null,
    mediaType: input.mediaType,
    storagePath,
    mediaUrl,
    caption: input.caption?.trim().slice(0, 500) || null,
    moderationStatus: moderationForRole(input.authorRole),
    fireCount: 0,
    commentCount: 0,
    legalConsent: true,
    createdAt: serverTimestamp(),
  });

  return postRef.id;
}

export async function fetchApprovedTribePosts(
  mediaType?: TribeMediaType,
  max = 12,
): Promise<TribePost[]> {
  const q = query(
    postsCol(),
    where("moderationStatus", "==", "approved"),
    orderBy("createdAt", "desc"),
    limit(max * 2),
  );
  const snap = await getDocs(q);
  let posts = snap.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as TribePost,
  );
  if (mediaType) {
    posts = posts.filter((p) => p.mediaType === mediaType);
  }
  return posts.slice(0, max);
}

/** Feed Tribu: aprobadas + propias pendientes si hay sesión */
export async function fetchTribeFeedPosts(
  viewerId: string | null,
  max = 30,
): Promise<TribePost[]> {
  const approvedQ = query(
    postsCol(),
    where("moderationStatus", "==", "approved"),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  const approvedSnap = await getDocs(approvedQ);
  const byId = new Map<string, TribePost>();
  for (const d of approvedSnap.docs) {
    byId.set(d.id, { id: d.id, ...d.data() } as TribePost);
  }

  if (viewerId) {
    const pendingQ = query(
      postsCol(),
      where("authorId", "==", viewerId),
      where("moderationStatus", "==", "pending"),
      orderBy("createdAt", "desc"),
      limit(10),
    );
    try {
      const pendingSnap = await getDocs(pendingQ);
      for (const d of pendingSnap.docs) {
        byId.set(d.id, { id: d.id, ...d.data() } as TribePost);
      }
    } catch {
      /* índice compuesto pendiente: omitir propias pending */
    }
  }

  return [...byId.values()].sort(
    (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis(),
  );
}

export async function userHasFired(
  postId: string,
  userId: string,
): Promise<boolean> {
  const snap = await getDoc(
    doc(getFirebaseDb(), POSTS, postId, "fires", userId),
  );
  return snap.exists();
}

export async function toggleTribeFire(
  postId: string,
  userId: string,
): Promise<{ fired: boolean; fireCount: number }> {
  const fireRef = doc(getFirebaseDb(), POSTS, postId, "fires", userId);
  const postRef = doc(getFirebaseDb(), POSTS, postId);
  const existing = await getDoc(fireRef);

  if (existing.exists()) {
    const batch = writeBatch(getFirebaseDb());
    batch.delete(fireRef);
    batch.update(postRef, { fireCount: increment(-1) });
    await batch.commit();
    const post = await getDoc(postRef);
    return {
      fired: false,
      fireCount: (post.data()?.fireCount as number) ?? 0,
    };
  }

  const batch = writeBatch(getFirebaseDb());
  batch.set(fireRef, { createdAt: serverTimestamp() });
  batch.update(postRef, { fireCount: increment(1) });
  await batch.commit();
  const post = await getDoc(postRef);
  return {
    fired: true,
    fireCount: (post.data()?.fireCount as number) ?? 1,
  };
}

export async function fetchTribeComments(postId: string): Promise<TribeComment[]> {
  const q = query(
    collection(getFirebaseDb(), POSTS, postId, "comments"),
    orderBy("createdAt", "asc"),
    limit(80),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TribeComment);
}

export async function addTribeComment(
  postId: string,
  authorId: string,
  authorDisplayName: string,
  text: string,
): Promise<void> {
  const trimmed = text.trim();
  if (trimmed.length < 1 || trimmed.length > 500) {
    throw new Error("El comentario debe tener entre 1 y 500 caracteres.");
  }

  const commentRef = doc(
    collection(getFirebaseDb(), POSTS, postId, "comments"),
  );
  const batch = writeBatch(getFirebaseDb());
  batch.set(commentRef, {
    authorId,
    authorDisplayName: authorDisplayName.trim() || "Alumno AM",
    text: trimmed,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(getFirebaseDb(), POSTS, postId), {
    commentCount: increment(1),
  });
  await batch.commit();
}

export async function deleteTribeComment(
  postId: string,
  commentId: string,
): Promise<void> {
  const batch = writeBatch(getFirebaseDb());
  batch.delete(doc(getFirebaseDb(), POSTS, postId, "comments", commentId));
  batch.update(doc(getFirebaseDb(), POSTS, postId), {
    commentCount: increment(-1),
  });
  await batch.commit();
}

export function getTribePostShareUrl(postId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/tribu?post=${postId}`;
  }
  return `/tribu?post=${postId}`;
}

export async function shareTribePost(post: TribePost): Promise<string> {
  const url = getTribePostShareUrl(post.id);
  const text =
    post.caption?.trim() ||
    "Momento en la nieve con AM Snowboard Coach · Sierra Nevada";

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({
        title: "AM Snowboard Coach",
        text,
        url,
      });
      return "shared";
    } catch (err) {
      if ((err as Error).name === "AbortError") return "cancelled";
    }
  }

  await navigator.clipboard.writeText(`${text}\n${url}`);
  return "copied";
}
