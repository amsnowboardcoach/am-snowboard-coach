import type { Timestamp } from "firebase/firestore";
import type { UserRole } from "@/constants/roles";

export type PaymentStatus = "pending" | "paid" | "refunded";
export type InvoiceStatus = "pending" | "issued" | "not_required";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  phone?: string;
  level?: "beginner" | "intermediate" | "advanced";
  assignedCoachId: string;
  stripeCustomerId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  preferences?: {
    notifications?: {
      lastMinute?: boolean;
      weather?: boolean;
      tribe?: boolean;
    };
  };
}

export interface BookingPayment {
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  paidAt?: Timestamp;
  amountCents: number;
  currency: "EUR";
}

export interface BookingInvoice {
  status: InvoiceStatus;
  number?: string;
  issuedAt?: Timestamp;
  amountCents?: number;
  notes?: string;
  pdfStoragePath?: string;
  pdfUrl?: string;
  issuedByCoachId?: string;
  updatedAt?: Timestamp;
}

export interface Booking {
  id: string;
  userId: string;
  coachId: string;
  lessonTypeId: string;
  lessonTypeName: string;
  calEventId?: string;
  startAt: Timestamp;
  endAt: Timestamp;
  timezone: "Europe/Madrid";
  status: BookingStatus;
  payment: BookingPayment;
  invoice: BookingInvoice;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
