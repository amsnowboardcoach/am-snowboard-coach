import type { BookingPaymentOption } from "@/constants/booking-payment";
import { isOnlinePaymentOption } from "@/constants/booking-payment";
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

/** Reserva web con pago online (señal o total en Stripe). */
export function webBookingRequiresOnlinePayment(data: {
  source?: string;
  payment?: { paymentOption?: BookingPaymentOption };
}): boolean {
  return (
    data.source === "web" &&
    Boolean(
      data.payment?.paymentOption &&
        isOnlinePaymentOption(data.payment.paymentOption),
    )
  );
}

/**
 * Si el turno cuenta como ocupado al consultar disponibilidad.
 * Reservas web sin pago no bloquean hasta que Stripe confirme la señal o el total.
 */
export function bookingHoldsCalendarSlot(data: {
  status: BookingStatus;
  source?: string;
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
