import type { BookingPaymentOption } from "@/constants/booking-payment";
import { isOnlinePaymentOption } from "@/constants/booking-payment";
import { isVideoCorrectionProduct } from "@/constants/video-correction";
import type { BookingStatus } from "@/types/firestore";

export type BookingPaymentStatus =
  | "pending"
  | "deposit_paid"
  | "paid"
  | "refunded";

export function isSessionPaymentSettled(
  status: BookingPaymentStatus,
): boolean {
  return status === "deposit_paid" || status === "paid";
}

/** Reserva web con pago online (señal o total en Stripe, o video corrección). */
export function webBookingRequiresOnlinePayment(data: {
  source?: string;
  productKind?: string;
  lessonTypeId?: string;
  payment?: { paymentOption?: BookingPaymentOption };
}): boolean {
  if (data.source !== "web") return false;
  if (
    data.productKind === "video_correction" ||
    isVideoCorrectionProduct(data.lessonTypeId)
  ) {
    return true;
  }
  return Boolean(
    data.payment?.paymentOption &&
      isOnlinePaymentOption(data.payment.paymentOption),
  );
}

/**
 * Si el turno cuenta como ocupado al consultar disponibilidad.
 * Reservas web sin pago no bloquean hasta que Stripe confirme la señal o el total.
 */
export function bookingHoldsCalendarSlot(data: {
  status: BookingStatus;
  source?: string;
  productKind?: string;
  lessonTypeId?: string;
  payment?: {
    status?: BookingPaymentStatus;
    paymentOption?: BookingPaymentOption;
  };
}): boolean {
  const { status } = data;
  if (status === "cancelled") return false;
  if (status === "confirmed" || status === "completed") return true;

  if (status === "pending") {
    const paymentStatus = data.payment?.status ?? "pending";

    if (webBookingRequiresOnlinePayment(data)) {
      return isSessionPaymentSettled(paymentStatus);
    }

    if (data.source === "hub" || data.source === "cal.com") {
      return true;
    }

    return isSessionPaymentSettled(paymentStatus);
  }

  return false;
}

/** Solicitud visible en «Por confirmar» del panel coach. */
export function bookingAwaitingCoachApproval(data: {
  status: BookingStatus;
  source?: string;
  productKind?: string;
  lessonTypeId?: string;
  payment: {
    status: BookingPaymentStatus;
    paymentOption?: BookingPaymentOption;
  };
}): boolean {
  if (data.status !== "pending") return false;
  if (data.source !== "web" && data.source !== "hub") return false;

  if (webBookingRequiresOnlinePayment(data)) {
    return isSessionPaymentSettled(data.payment.status);
  }

  return true;
}
