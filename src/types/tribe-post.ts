import type { Timestamp } from "firebase/firestore";

export type TribeMediaType = "photo" | "video";

export type TribeModerationStatus = "pending" | "approved" | "rejected";

export interface TribePost {
  id: string;
  authorId: string;
  authorDisplayName: string;
  authorPhotoURL?: string;
  mediaType: TribeMediaType;
  storagePath: string;
  mediaUrl: string;
  caption?: string;
  moderationStatus: TribeModerationStatus;
  fireCount: number;
  commentCount: number;
  legalConsent: boolean;
  createdAt: Timestamp;
}

export interface TribeComment {
  id: string;
  authorId: string;
  authorDisplayName: string;
  text: string;
  createdAt: Timestamp;
}
