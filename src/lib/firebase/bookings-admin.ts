import { FieldValue, Timestamp } from "firebase-admin/firestore";
import {
  getSessionDuration,
  sessionTotalCents,
  sessionTotalEuros,
  type SessionDuration,
  type SessionDurationId,
} from "@/constants/session-schedules";
import {
  BOOKING_LOCATION,
  bookingPracticalInfoPlainLines,
} from "@/constants/booking-info";
import { createCalendarEvent } from "@/lib/google/calendar";
import {
  sendBookingConfirmedEmails,
  sendBookingRejectedEmail,
  type BookingEmailDetails,
} from "@/lib/email/send-booking";
import {
  notifyAfterBookingPaid,
  notifyStudentBookingConfirmed,
  notifyStudentBookingRejected,
} from "@/lib/push/send-push";
import { getAppBaseUrl } from "@/constants/project";
import {
  VIDEO_CORRECTION_PRODUCT,
  isVideoCorrectionProduct,
  videoCorrectionTotalCents,
  videoCorrectionTotalEuros,
} from "@/constants/video-correction";
import { formatBookingInTimeZone } from "@/lib/booking/format-datetime";
import {
  sendVideoCorrectionConfirmedEmails,
  sendVideoCorrectionRejectedEmail,
} from "@/lib/email/send-booking";
import type { BookingPaymentOption } from "@/constants/booking-payment";
import { isOnlinePaymentOption } from "@/constants/booking-payment";
import { computeBookingPaymentBreakdown } from "@/lib/booking/payment-amounts";
import { isStripeConfigured } from "@/lib/stripe/config";
import type { ParsedCalBooking } from "@/lib/cal/parse-payload";
import type { CalTriggerEvent } from "@/lib/cal/types";
import { getAdminDb } from "@/lib/firebase/admin";
import type { BookingStatus } from "@/types/firestore";

const BOOKINGS = "bookings";
const USERS = "users";

export class FirebaseAdminNotConfiguredError extends Error {
  constructor() {
    super(
      "Firebase Admin no configurado (FIREBASE_ADMIN_* en .env.local)",
    );
    this.name = "FirebaseAdminNotConfiguredError";
  }
}

function getCoachId(): string {
  const id = process.env.NEXT_PUBLIC_DEFAULT_COACH_ID?.trim();
  if (!id) {
    throw new Error("NEXT_PUBLIC_DEFAULT_COACH_ID no configurado");
  }
  return id;
}

function adminDb() {
  try {
    return getAdminDb();
  } catch {
    throw new FirebaseAdminNotConfiguredError();
  }
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  if (!email) return null;
  const snap = await adminDb()
    .collection(USERS)
    .where("email", "==", email)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0]!.id;
}

async function findBookingByCalUid(
  calUid: string,
): Promise<FirebaseFirestore.DocumentSnapshot | null> {
  const snap = await adminDb()
    .collection(BOOKINGS)
    .where("calEventId", "==", calUid)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return snap.docs[0]!;
}

function bookingDocData(parsed: ParsedCalBooking, userId: string, coachId: string) {
  const paymentStatus = "pending" as const;
  const invoiceStatus = "not_required" as const;

  return {
    coachId,
    userId,
    studentDisplayName: parsed.studentDisplayName,
    studentEmail: parsed.studentEmail,
    lessonTypeId: parsed.lessonTypeId,
    lessonTypeName: parsed.lessonTypeName,
    sessionDurationId: parsed.sessionDurationId,
    calEventId: parsed.calUid,
    calBookingId: parsed.calBookingId ?? null,
    calEventTypeSlug: parsed.calEventTypeSlug,
    source: "cal.com" as const,
    bookingNotes: parsed.notes ?? null,
    startAt: Timestamp.fromDate(parsed.startAt),
    endAt: Timestamp.fromDate(parsed.endAt),
    timezone: "Europe/Madrid" as const,
    status: parsed.status,
    payment: {
      status: paymentStatus,
      amountCents: parsed.amountCents,
      currency: "EUR" as const,
    },
    invoice: { status: invoiceStatus },
    updatedAt: FieldValue.serverTimestamp(),
  };
}

export interface CalWebhookSyncResult {
  action: "created" | "updated" | "skipped";
  bookingId?: string;
  calUid?: string;
  reason?: string;
}

export async function syncBookingFromCalWebhook(
  trigger: CalTriggerEvent,
  parsed: ParsedCalBooking,
): Promise<CalWebhookSyncResult> {
  const coachId = getCoachId();
  const userId =
    (await findUserIdByEmail(parsed.studentEmail)) ?? "";
  const existing = await findBookingByCalUid(parsed.calUid);

  if (trigger === "BOOKING_CANCELLED" || trigger === "BOOKING_REJECTED") {
    if (!existing) {
      return { action: "skipped", calUid: parsed.calUid, reason: "no_booking" };
    }
    await existing.ref.update({
      status: "cancelled" satisfies BookingStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return { action: "updated", bookingId: existing.id, calUid: parsed.calUid };
  }

  const data = bookingDocData(parsed, userId, coachId);

  if (existing) {
    await existing.ref.update(data);
    return { action: "updated", bookingId: existing.id, calUid: parsed.calUid };
  }

  const ref = await adminDb().collection(BOOKINGS).add({
    ...data,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { action: "created", bookingId: ref.id, calUid: parsed.calUid };
}

export interface WebBookingInput {
  session: SessionDuration;
  slotId: string;
  slotLabel: string;
  lessonTypeId: string;
  lessonTypeName: string;
  studentDisplayName: string;
  studentEmail: string;
  startAt: Date;
  endAt: Date;
  /** Personas en pista (mín. 1). */
  participantCount: number;
  notes?: string;
  /** UID Firebase cuando la reserva viene de un alumno autenticado. */
  authUserId?: string;
  paymentOption?: BookingPaymentOption;
  paymentGroupId?: string;
}

export interface VideoCorrectionBookingInput {
  studentDisplayName: string;
  studentEmail: string;
  videoCount: number;
  notes?: string;
  authUserId?: string;
}

export interface AdminBookingRecord {
  id: string;
  coachId: string;
  userId: string;
  studentDisplayName?: string;
  studentEmail?: string;
  lessonTypeId: string;
  lessonTypeName: string;
  productKind?: "session" | "video_correction";
  videoCount?: number;
  sessionDurationId?: string;
  sessionSlotId?: string;
  sessionSlotLabel?: string;
  participantCount?: number;
  googleCalendarEventId?: string;
  source?: string;
  bookingNotes?: string;
  startAt: Date;
  endAt: Date;
  status: BookingStatus;
  payment: {
    amountCents: number;
    totalAmountCents?: number;
    depositAmountCents?: number;
    balanceAmountCents?: number;
    paymentOption?: BookingPaymentOption;
    paymentGroupId?: string;
    status: "pending" | "deposit_paid" | "paid" | "refunded";
    stripeSessionId?: string;
  };
}

export async function getBookingById(
  bookingId: string,
): Promise<AdminBookingRecord | null> {
  const snap = await adminDb().collection(BOOKINGS).doc(bookingId).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  return {
    id: snap.id,
    coachId: d.coachId as string,
    userId: (d.userId as string) || "",
    studentDisplayName: d.studentDisplayName as string | undefined,
    studentEmail: d.studentEmail as string | undefined,
    lessonTypeId: d.lessonTypeId as string,
    lessonTypeName: d.lessonTypeName as string,
    productKind: d.productKind as AdminBookingRecord["productKind"],
    videoCount: d.videoCount as number | undefined,
    sessionDurationId: d.sessionDurationId as string | undefined,
    sessionSlotId: d.sessionSlotId as string | undefined,
    sessionSlotLabel: d.sessionSlotLabel as string | undefined,
    participantCount: (d.participantCount as number | undefined) ?? 1,
    googleCalendarEventId: d.googleCalendarEventId as string | undefined,
    source: d.source as string | undefined,
    bookingNotes: d.bookingNotes as string | undefined,
    startAt: (d.startAt as Timestamp).toDate(),
    endAt: (d.endAt as Timestamp).toDate(),
    status: d.status as BookingStatus,
    payment: {
      amountCents: (d.payment as { amountCents: number }).amountCents,
      totalAmountCents: (d.payment as { totalAmountCents?: number })
        .totalAmountCents,
      depositAmountCents: (d.payment as { depositAmountCents?: number })
        .depositAmountCents,
      balanceAmountCents: (d.payment as { balanceAmountCents?: number })
        .balanceAmountCents,
      paymentOption: (d.payment as { paymentOption?: BookingPaymentOption })
        .paymentOption,
      paymentGroupId: (d.payment as { paymentGroupId?: string }).paymentGroupId,
      status: ((d.payment as { status?: string }).status ?? "pending") as
        | "pending"
        | "deposit_paid"
        | "paid"
        | "refunded",
      stripeSessionId: (d.payment as { stripeSessionId?: string })
        .stripeSessionId,
    },
  };
}

function stripePaymentStatus(
  paymentOption: BookingPaymentOption,
): "paid" | "deposit_paid" {
  return paymentOption === "deposit_30" ? "deposit_paid" : "paid";
}

async function applyStripePaymentToBooking(
  bookingId: string,
  input: {
    stripeSessionId: string;
    stripePaymentIntentId?: string;
    paymentOption: BookingPaymentOption;
  },
): Promise<void> {
  const ref = adminDb().collection(BOOKINGS).doc(bookingId);
  const snap = await ref.get();
  if (!snap.exists) return;

  const data = snap.data()!;
  const payment = data.payment as {
    status?: string;
    paymentOption?: BookingPaymentOption;
  };
  if (payment.status === "paid") return;
  if (
    payment.status === "deposit_paid" &&
    input.paymentOption === "deposit_30"
  ) {
    return;
  }

  const nextStatus = stripePaymentStatus(input.paymentOption);

  await ref.update({
    payment: {
      ...(data.payment as object),
      status: nextStatus,
      stripeSessionId: input.stripeSessionId,
      ...(input.stripePaymentIntentId
        ? { stripePaymentIntentId: input.stripePaymentIntentId }
        : {}),
      paidAt: FieldValue.serverTimestamp(),
    },
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function markBookingsPaidFromStripe(input: {
  bookingIds: string[];
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  paymentOption: BookingPaymentOption;
}): Promise<void> {
  const uniqueIds = [...new Set(input.bookingIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    throw new Error("Sin reservas en el pago");
  }

  for (const bookingId of uniqueIds) {
    await applyStripePaymentToBooking(bookingId, input);
  }

  const booking = await getBookingById(uniqueIds[0]!);
  if (booking) {
    try {
      await notifyAfterBookingPaid({
        id: booking.id,
        userId: booking.userId,
        studentDisplayName: booking.studentDisplayName,
        studentEmail: booking.studentEmail,
        lessonTypeId: booking.lessonTypeId,
        lessonTypeName: booking.lessonTypeName,
        productKind: booking.productKind,
        sessionDurationId: booking.sessionDurationId,
        sessionSlotLabel: booking.sessionSlotLabel,
        startAt: booking.startAt,
        endAt: booking.endAt,
        amountCents: booking.payment.amountCents,
      });
    } catch (pushErr) {
      console.error("[markBookingPaid] Push:", pushErr);
    }
  }
}

export async function markBookingPaidFromStripe(input: {
  bookingId: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  paymentOption?: BookingPaymentOption;
}): Promise<void> {
  const booking = await getBookingById(input.bookingId);
  const option =
    input.paymentOption ??
    booking?.payment.paymentOption ??
    "full_stripe";

  await markBookingsPaidFromStripe({
    bookingIds: [input.bookingId],
    stripeSessionId: input.stripeSessionId,
    stripePaymentIntentId: input.stripePaymentIntentId,
    paymentOption: option,
  });
}

function bookingToEmailDetails(
  booking: AdminBookingRecord,
  session: SessionDuration,
): BookingEmailDetails {
  const totalCents =
    booking.payment.totalAmountCents ?? booking.payment.amountCents;
  const totalEuros = Math.round(totalCents / 100);
  const chargeEuros = Math.round(booking.payment.amountCents / 100);
  const balanceEuros = Math.round(
    (booking.payment.balanceAmountCents ?? 0) / 100,
  );
  return {
    studentName: booking.studentDisplayName || booking.studentEmail || "Alumno",
    studentEmail: booking.studentEmail || "",
    session,
    slotLabel: booking.sessionSlotLabel || session.name,
    startAt: booking.startAt,
    endAt: booking.endAt,
    lessonTypeName: booking.lessonTypeName,
    notes: booking.bookingNotes,
    participantCount: booking.participantCount,
    totalEuros: totalEuros || sessionTotalEuros(session, booking.participantCount),
    paidWithCard:
      booking.payment.status === "paid" ||
      booking.payment.status === "deposit_paid",
    paymentOption: booking.payment.paymentOption,
    chargeEuros:
      booking.payment.status !== "pending" ? chargeEuros : undefined,
    balanceEuros:
      booking.payment.paymentOption === "deposit_30" ? balanceEuros : 0,
    isRegisteredStudent: Boolean(booking.userId?.trim()),
  };
}

function videoEmailDetails(booking: AdminBookingRecord) {
  const count = booking.videoCount ?? 1;
  return {
    studentName: booking.studentDisplayName || booking.studentEmail || "Alumno",
    studentEmail: booking.studentEmail || "",
    videoCount: count,
    totalEuros: Math.round(booking.payment.amountCents / 100),
    notes: booking.bookingNotes,
    paidWithCard:
      booking.payment.status === "paid" ||
      booking.payment.status === "deposit_paid",
  };
}

/** Reservas que solapan un intervalo (no canceladas) */
export async function findOverlappingBookings(
  rangeStart: Date,
  rangeEnd: Date,
  excludeBookingId?: string,
): Promise<{ startAt: FirebaseFirestore.Timestamp; endAt: FirebaseFirestore.Timestamp }[]> {
  const coachId = getCoachId();
  const queryFrom = new Date(rangeStart.getTime() - 8 * 60 * 60 * 1000);
  const snap = await adminDb()
    .collection(BOOKINGS)
    .where("coachId", "==", coachId)
    .get();

  return snap.docs
    .filter((d) => {
      if (excludeBookingId && d.id === excludeBookingId) return false;
      const data = d.data();
      const status = data.status as string;
      if (status === "cancelled") return false;
      const startAt = (data.startAt as FirebaseFirestore.Timestamp).toDate();
      return startAt >= queryFrom && startAt <= rangeEnd;
    })
    .map((d) => ({
      startAt: d.data().startAt as FirebaseFirestore.Timestamp,
      endAt: d.data().endAt as FirebaseFirestore.Timestamp,
    }))
    .filter((b) => b.startAt.toDate() < rangeEnd && b.endAt.toDate() > rangeStart);
}

/** Reserva desde la web (Firestore + Google Calendar) */
export async function createBookingFromWeb(
  input: WebBookingInput,
): Promise<string> {
  const coachId = getCoachId();
  const userId =
    input.authUserId ??
    (await findUserIdByEmail(input.studentEmail)) ??
    "";

  const overlapping = await findOverlappingBookings(input.startAt, input.endAt);
  if (overlapping.length > 0) {
    throw new Error("Ese turno ya está reservado");
  }

  const paymentOption = input.paymentOption ?? "deposit_30";
  const totalAmountCents = sessionTotalCents(
    input.session,
    input.participantCount,
  );
  const breakdown = computeBookingPaymentBreakdown(
    totalAmountCents,
    paymentOption,
  );

  const ref = await adminDb().collection(BOOKINGS).add({
    coachId,
    userId,
    studentDisplayName: input.studentDisplayName,
    studentEmail: input.studentEmail,
    lessonTypeId: input.lessonTypeId,
    lessonTypeName: input.lessonTypeName,
    sessionDurationId: input.session.id,
    sessionSlotId: input.slotId,
    sessionSlotLabel: input.slotLabel,
    participantCount: input.participantCount,
    googleCalendarEventId: null,
    source: "web" as const,
    bookingNotes: input.notes ?? null,
    startAt: Timestamp.fromDate(input.startAt),
    endAt: Timestamp.fromDate(input.endAt),
    timezone: "Europe/Madrid" as const,
    status: "pending" satisfies BookingStatus,
    payment: {
      status: "pending" as const,
      paymentOption,
      paymentGroupId: input.paymentGroupId ?? null,
      totalAmountCents: breakdown.totalAmountCents,
      amountCents: breakdown.chargeAmountCents,
      depositAmountCents: breakdown.depositAmountCents,
      balanceAmountCents: breakdown.balanceAmountCents,
      currency: "EUR" as const,
    },
    invoice: { status: "not_required" as const },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return ref.id;
}

/** Solicitud de video corrección (sin calendario de pista) */
export async function createVideoCorrectionBookingFromWeb(
  input: VideoCorrectionBookingInput,
): Promise<string> {
  const coachId = getCoachId();
  const userId =
    input.authUserId ??
    (await findUserIdByEmail(input.studentEmail)) ??
    "";
  const now = new Date();
  const end = new Date(now.getTime() + 60_000);
  const count = input.videoCount;

  const ref = await adminDb().collection(BOOKINGS).add({
    coachId,
    userId,
    studentDisplayName: input.studentDisplayName,
    studentEmail: input.studentEmail,
    lessonTypeId: VIDEO_CORRECTION_PRODUCT.id,
    lessonTypeName: VIDEO_CORRECTION_PRODUCT.name,
    productKind: "video_correction" as const,
    videoCount: count,
    sessionDurationId: null,
    sessionSlotId: null,
    sessionSlotLabel: `${count} vídeo${count > 1 ? "s" : ""} a corregir`,
    googleCalendarEventId: null,
    source: "web" as const,
    bookingNotes: input.notes ?? null,
    startAt: Timestamp.fromDate(now),
    endAt: Timestamp.fromDate(end),
    timezone: "Europe/Madrid" as const,
    status: "pending" satisfies BookingStatus,
    payment: {
      status: "pending" as const,
      amountCents: videoCorrectionTotalCents(count),
      currency: "EUR" as const,
    },
    invoice: { status: "not_required" as const },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return ref.id;
}

export async function confirmBookingByCoach(
  bookingId: string,
): Promise<void> {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error("Reserva no encontrada");
  if (booking.coachId !== getCoachId()) {
    throw new Error("No autorizado");
  }
  if (booking.status !== "pending") {
    throw new Error("Esta reserva ya no está pendiente");
  }

  if (
    booking.productKind === "video_correction" ||
    isVideoCorrectionProduct(booking.lessonTypeId)
  ) {
    await adminDb().collection(BOOKINGS).doc(bookingId).update({
      status: "confirmed" satisfies BookingStatus,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const paymentUrl =
      isStripeConfigured() && booking.payment.status !== "paid"
        ? `${getAppBaseUrl()}/pagar/${bookingId}`
        : undefined;

    const details = videoEmailDetails(booking);
    if (details.studentEmail) {
      await sendVideoCorrectionConfirmedEmails({
        ...details,
        paymentUrl,
      });
    }

    await notifyStudentBookingConfirmed({
      userId: booking.userId,
      dateLabel: "Video corrección",
      slotLabel: `${details.videoCount} vídeo${details.videoCount > 1 ? "s" : ""}`,
      paymentUrl,
      isVideoCorrection: true,
      videoCount: details.videoCount,
    });
    return;
  }

  const session = getSessionDuration(
    (booking.sessionDurationId || "2h") as SessionDurationId,
  );
  if (!session) throw new Error("Duración de sesión inválida");

  const overlapping = await findOverlappingBookings(
    booking.startAt,
    booking.endAt,
    bookingId,
  );
  if (overlapping.length > 0) {
    throw new Error("Ese turno ya no está disponible");
  }

  const studentName =
    booking.studentDisplayName || booking.studentEmail || "Alumno";
  const studentEmail = booking.studentEmail || "";
  const summary = `Clase snowboard — ${studentName} (${booking.lessonTypeName})`;

  const googleCalendarEventId = await createCalendarEvent({
    summary,
    description: [
      booking.bookingNotes,
      `Importe: ${Math.round(booking.payment.amountCents / 100)} €`,
      booking.participantCount && booking.participantCount > 1
        ? `Personas en pista: ${booking.participantCount}`
        : null,
      ...bookingPracticalInfoPlainLines(),
      `Email: ${studentEmail}`,
    ]
      .filter(Boolean)
      .join("\n"),
    start: booking.startAt,
    end: booking.endAt,
    studentEmail,
    studentName,
    location: BOOKING_LOCATION,
  });

  await adminDb().collection(BOOKINGS).doc(bookingId).update({
    status: "confirmed" satisfies BookingStatus,
    googleCalendarEventId,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const needsCardAfterConfirm =
    booking.payment.paymentOption === "after_confirm" &&
    booking.payment.status === "pending";
  const paymentUrl =
    isStripeConfigured() && needsCardAfterConfirm
      ? `${getAppBaseUrl()}/pagar/${bookingId}`
      : undefined;

  if (studentEmail) {
    await sendBookingConfirmedEmails({
      ...bookingToEmailDetails(booking, session),
      paymentUrl,
    });
  }

  await notifyStudentBookingConfirmed({
    userId: booking.userId,
    dateLabel: formatBookingInTimeZone(booking.startAt, "d MMM yyyy"),
    slotLabel: booking.sessionSlotLabel || session.name,
    paymentUrl,
    startAt: booking.startAt,
    endAt: booking.endAt,
    isVideoCorrection: false,
  });
}

export async function rejectBookingByCoach(bookingId: string): Promise<void> {
  const booking = await getBookingById(bookingId);
  if (!booking) throw new Error("Reserva no encontrada");
  if (booking.coachId !== getCoachId()) {
    throw new Error("No autorizado");
  }
  if (booking.status !== "pending") {
    throw new Error("Esta reserva ya no está pendiente");
  }

  await adminDb().collection(BOOKINGS).doc(bookingId).update({
    status: "cancelled" satisfies BookingStatus,
    updatedAt: FieldValue.serverTimestamp(),
  });

  if (
    booking.productKind === "video_correction" ||
    isVideoCorrectionProduct(booking.lessonTypeId)
  ) {
    if (booking.studentEmail) {
      await sendVideoCorrectionRejectedEmail(videoEmailDetails(booking));
    }
    await notifyStudentBookingRejected({
      userId: booking.userId,
      dateLabel: "Video corrección",
      isVideoCorrection: true,
    });
    return;
  }

  const session = getSessionDuration(
    (booking.sessionDurationId || "2h") as SessionDurationId,
  );
  if (!session) throw new Error("Duración de sesión inválida");

  if (booking.studentEmail) {
    await sendBookingRejectedEmail(bookingToEmailDetails(booking, session));
  }

  await notifyStudentBookingRejected({
    userId: booking.userId,
    dateLabel: formatBookingInTimeZone(booking.startAt, "d MMM yyyy"),
    startAt: booking.startAt,
    endAt: booking.endAt,
    isVideoCorrection: false,
  });
}
