import type { Timestamp } from "firebase/firestore";
import type { TrickCategory } from "@/constants/tricks-catalog";

export type TrickStatus = "locked" | "in_progress" | "unlocked" | "mastered";

export interface TrickCatalogDoc {
  id: string;
  name: string;
  slug: string;
  category: TrickCategory;
  difficulty: number;
  description: string;
  sortOrder: number;
  active: boolean;
}

export interface TrickProgressDoc {
  trickId: string;
  category: TrickCategory;
  status: TrickStatus;
  unlockedByCoachId?: string;
  unlockedAt?: Timestamp;
  coachNotes?: string;
  order: number;
}

export interface TrickWithProgress extends TrickCatalogDoc {
  progress: TrickProgressDoc | null;
}
