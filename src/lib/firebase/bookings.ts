import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { LESSON_TYPES, lessonPublicName } from "@/constants/lesson-types";
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase/client";
import type {
  Booking,
  BookingInvoice,
  BookingStatus,
  InvoiceRecipient,
  InvoiceStatus,
  InvoiceTaxBreakdown,
  PaymentStatus,
} from "@/types/firestore";
import type { InvoiceDocumentType } from "@/constants/invoicing";
import type { IssuerConfig } from "@/types/issuer";

const BOOKINGS = "bookings";

export async function fetchCoachBookings(coachId: string): Promise<Booking[]> {
  const q = query(
    collection(getFirebaseDb(), BOOKINGS),
    where("coachId", "==", coachId),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Booking)
    .sort((a, b) => b.startAt.toMillis() - a.startAt.toMillis());
}

export interface CreateBookingInput {
  coachId: string;
  studentDisplayName: string;
  studentEmail?: string;
  userId?: string;
  lessonTypeId: string;
  startAt: Date;
  durationMinutes: number;
  amountEuros: number;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
}

export async function createBooking(input: CreateBookingInput): Promise<string> {
  const lesson = LESSON_TYPES.find((l) => l.id === input.lessonTypeId);
  const endAt = new Date(
    input.startAt.getTime() + input.durationMinutes * 60 * 1000,
  );
  const amountCents = Math.round(input.amountEuros * 100);

  const docRef = await addDoc(collection(getFirebaseDb(), BOOKINGS), {
    coachId: input.coachId,
    userId: input.userId ?? "",
    studentDisplayName: input.studentDisplayName.trim(),
    studentEmail: input.studentEmail?.trim() ?? "",
    lessonTypeId: input.lessonTypeId,
    lessonTypeName: lesson ? lessonPublicName(lesson) : input.lessonTypeId,
    startAt: Timestamp.fromDate(input.startAt),
    endAt: Timestamp.fromDate(endAt),
    timezone: "Europe/Madrid",
    status: input.status,
    payment: {
      status: input.paymentStatus,
      amountCents,
      currency: "EUR",
      ...(input.paymentStatus === "paid"
        ? { paidAt: serverTimestamp() }
        : {}),
    },
    invoice: {
      status:
        input.paymentStatus === "paid" ? "pending" : ("not_required" as const),
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateBookingPayment(
  bookingId: string,
  paymentStatus: PaymentStatus,
  amountCents: number,
): Promise<void> {
  const invoiceStatus: InvoiceStatus =
    paymentStatus === "paid" ? "pending" : "not_required";

  const payment: Record<string, unknown> = {
    status: paymentStatus,
    amountCents,
    currency: "EUR",
  };
  if (paymentStatus === "paid") {
    payment.paidAt = serverTimestamp();
  }

  await updateDoc(doc(getFirebaseDb(), BOOKINGS, bookingId), {
    payment,
    invoice: { status: invoiceStatus },
    updatedAt: serverTimestamp(),
  });
}

export interface UpdateBookingInvoiceInput {
  status: InvoiceStatus;
  number?: string;
  issuedAt?: Date;
  documentType?: InvoiceDocumentType;
  concept?: string;
  issuer?: Pick<IssuerConfig, "legalName" | "taxId">;
  recipient?: InvoiceRecipient;
  tax?: InvoiceTaxBreakdown;
  notes?: string;
  pdfUrl?: string;
  pdfStoragePath?: string;
}

export async function updateBookingInvoice(
  bookingId: string,
  coachId: string,
  data: UpdateBookingInvoiceInput,
): Promise<void> {
  const invoice: BookingInvoice = {
    status: data.status,
    issuedByCoachId: coachId,
    ...(data.number ? { number: data.number } : {}),
    ...(data.issuedAt
      ? { issuedAt: Timestamp.fromDate(data.issuedAt) }
      : {}),
    ...(data.documentType ? { documentType: data.documentType } : {}),
    ...(data.concept ? { concept: data.concept } : {}),
    ...(data.issuer
      ? {
          issuerLegalName: data.issuer.legalName,
          issuerTaxId: data.issuer.taxId,
        }
      : {}),
    ...(data.recipient ? { recipient: data.recipient } : {}),
    ...(data.tax
      ? {
          tax: data.tax,
          amountCents: data.tax.totalAmountCents,
        }
      : {}),
    ...(data.notes ? { notes: data.notes } : {}),
    ...(data.pdfUrl ? { pdfUrl: data.pdfUrl } : {}),
    ...(data.pdfStoragePath ? { pdfStoragePath: data.pdfStoragePath } : {}),
  };

  await updateDoc(doc(getFirebaseDb(), BOOKINGS, bookingId), {
    invoice,
    updatedAt: serverTimestamp(),
  });
}

export async function uploadInvoicePdf(
  bookingId: string,
  file: File,
): Promise<{ pdfUrl: string; pdfStoragePath: string }> {
  const path = `invoices/${bookingId}/${file.name}`;
  const storageRef = ref(getFirebaseStorage(), path);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const pdfUrl = await getDownloadURL(storageRef);
  return { pdfUrl, pdfStoragePath: path };
}

export function countPaidWithoutInvoice(bookings: Booking[]): number {
  return bookings.filter(
    (b) =>
      b.payment.status === "paid" && b.invoice.status === "pending",
  ).length;
}
