import type { Timestamp } from "firebase/firestore";
import type { UserRole } from "@/constants/roles";

export type PaymentStatus =
  | "pending"
  | "deposit_paid"
  | "paid"
  | "refunded";

export type BookingPaymentOption =
  | "deposit_30"
  | "full_stripe"
  | "after_confirm";
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
  /** `custom` = foto subida por el alumno; no sobrescribir con Google al entrar */
  avatarSource?: "google" | "custom";
  role: UserRole;
  phone?: string;
  level?: "beginner" | "intermediate" | "advanced";
  assignedCoachId: string;
  stripeCustomerId?: string;
  /** El coach ya recibió aviso (push/email) de este registro */
  registrationCoachNotified?: boolean;
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
  /** Cómo eligió pagar el alumno */
  paymentOption?: BookingPaymentOption;
  /** Importe total de la clase (100%) */
  totalAmountCents?: number;
  /** Importe cobrado por Stripe (señal o total) */
  amountCents: number;
  depositAmountCents?: number;
  balanceAmountCents?: number;
  /** Agrupa varias clases en un solo checkout */
  paymentGroupId?: string;
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  paidAt?: Timestamp;
  currency: "EUR";
}

export type InvoiceDocumentType = "simplified" | "full";
export type InvoiceRecipientType = "individual" | "business";

export interface InvoiceRecipient {
  type: InvoiceRecipientType;
  legalName: string;
  taxId?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  country: string;
  email?: string;
}

export interface InvoiceTaxBreakdown {
  vatRatePercent: number;
  baseAmountCents: number;
  vatAmountCents: number;
  totalAmountCents: number;
  priceIncludesVat: boolean;
  vatExemptionReason?: string;
}

export interface BookingInvoice {
  status: InvoiceStatus;
  number?: string;
  issuedAt?: Timestamp;
  /** @deprecated Usar tax.totalAmountCents */
  amountCents?: number;
  documentType?: InvoiceDocumentType;
  concept?: string;
  /** Snapshot del emisor en el momento de emitir */
  issuerTaxId?: string;
  issuerLegalName?: string;
  recipient?: InvoiceRecipient;
  tax?: InvoiceTaxBreakdown;
  notes?: string;
  pdfStoragePath?: string;
  pdfUrl?: string;
  issuedByCoachId?: string;
  updatedAt?: Timestamp;
}

export interface Booking {
  id: string;
  userId: string;
  alumnoDisplayName?: string;
  alumnoEmail?: string;
  /** @deprecated Firestore legacy */
  studentDisplayName?: string;
  /** @deprecated Firestore legacy */
  studentEmail?: string;
  coachId: string;
  lessonTypeId: string;
  lessonTypeName: string;
  productKind?: "session" | "video_correction";
  videoCount?: number;
  /** uid de Cal.com (idempotencia webhook) */
  calEventId?: string;
  calBookingId?: number;
  calEventTypeSlug?: string;
  googleCalendarEventId?: string;
  sessionDurationId?: string;
  sessionSlotId?: string;
  sessionSlotLabel?: string;
  /** Personas en pista (quien reserva cuenta como 1). Por defecto 1. */
  participantCount?: number;
  source?: "web" | "cal.com" | "hub" | "manual";
  bookingNotes?: string;
  startAt: Timestamp;
  endAt: Timestamp;
  timezone: "Europe/Madrid";
  status: BookingStatus;
  payment: BookingPayment;
  invoice: BookingInvoice;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
