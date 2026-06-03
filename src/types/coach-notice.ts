import type { Timestamp } from "firebase/firestore";
import type { CoachBroadcastTemplateId } from "@/constants/coach-alumno-messages";

export interface CoachNoticeDoc {
  id: string;
  title: string;
  body: string;
  templateId: CoachBroadcastTemplateId;
  templateLabel?: string;
  coachId: string;
  createdAt: Timestamp;
  readAt?: Timestamp | null;
}
