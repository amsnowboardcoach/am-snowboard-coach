import type { Timestamp } from "firebase/firestore";

export type ProgressVideoStatus = "pending_review" | "reviewed";

export interface ProgressVideo {
  id: string;
  alumnoId: string;
  title: string;
  storagePath: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  status: ProgressVideoStatus;
  coachNotes: string;
  coachNotesUpdatedAt?: Timestamp;
  reviewedAt?: Timestamp;
  uploadedAt: Timestamp;
}
