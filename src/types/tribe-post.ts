import type { Timestamp } from "firebase/firestore";
import type { TrickStatus } from "@/types/tricks";

export type TribeMediaType = "photo" | "video";

export type TribePostKind = "media" | "passport";

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
  /** Ausente en publicaciones antiguas (= media). */
  postKind?: TribePostKind;
  passportTrickId?: string;
  passportTrickName?: string;
  passportTrickStatus?: TrickStatus;
  moderationStatus: TribeModerationStatus;
  fireCount: number;
  commentCount: number;
  legalConsent: boolean;
  createdAt: Timestamp;
}

export interface TribePassportShareMeta {
  trickId: string;
  trickName: string;
  trickStatus: TrickStatus;
}

export interface TribeComment {
  id: string;
  authorId: string;
  authorDisplayName: string;
  text: string;
  createdAt: Timestamp;
}
