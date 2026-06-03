import { randomUUID } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { ROLES } from "@/constants/roles";
import { getAdminDb } from "@/lib/firebase/admin";
import { inferFileContentType } from "@/lib/utils/media-file";
import type { TribeMediaType, TribePassportShareMeta } from "@/types/tribe-post";

function getBucket() {
  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  return bucketName ? getStorage().bucket(bucketName) : getStorage().bucket();
}

function publicDownloadUrl(bucketName: string, storagePath: string, token: string) {
  const encoded = encodeURIComponent(storagePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${token}`;
}

export async function adminCreateTribePost(input: {
  authorId: string;
  authorDisplayName: string;
  authorPhotoURL?: string;
  fileBuffer: Buffer;
  fileName: string;
  mediaType: TribeMediaType;
  caption?: string;
  passport?: TribePassportShareMeta;
}): Promise<string> {
  const db = getAdminDb();
  const postRef = db.collection("tribe_posts").doc();
  const safeName = input.fileName.replace(/[^\w.\-() ]/g, "_").slice(0, 120);
  const storagePath = `tribe/${postRef.id}/${safeName}`;
  const contentType =
    inferFileContentType({
      name: input.fileName,
      type: "",
    } as File) || (input.mediaType === "photo" ? "image/jpeg" : "video/mp4");

  const token = randomUUID();
  const bucket = getBucket();
  const file = bucket.file(storagePath);

  await file.save(input.fileBuffer, {
    metadata: {
      contentType,
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  const mediaUrl = publicDownloadUrl(bucket.name, storagePath, token);

  await postRef.set({
    authorId: input.authorId,
    authorDisplayName: input.authorDisplayName.trim() || "Alumno AM",
    authorPhotoURL: input.authorPhotoURL ?? null,
    mediaType: input.mediaType,
    storagePath,
    mediaUrl,
    caption: input.caption?.trim().slice(0, 500) || null,
    moderationStatus: "pending",
    fireCount: 0,
    commentCount: 0,
    legalConsent: true,
    createdAt: FieldValue.serverTimestamp(),
    ...(input.passport
      ? {
          postKind: "passport",
          passportTrickId: input.passport.trickId,
          passportTrickName: input.passport.trickName.slice(0, 120),
          passportTrickStatus: input.passport.trickStatus,
        }
      : {}),
  });

  return postRef.id;
}
