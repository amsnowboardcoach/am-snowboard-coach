import { isOnlinePaymentOption } from "@/constants/booking-payment";
import type { BookingPaymentOption } from "@/constants/booking-payment";
import { isStripeConfigured } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

export interface RefundableBookingPayment {
  amountCents: number;
  status: "pending" | "deposit_paid" | "paid" | "refunded";
  paymentOption?: BookingPaymentOption;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
}

function paymentWasChargedOnline(
  payment: RefundableBookingPayment,
): boolean {
  if (payment.status !== "deposit_paid" && payment.status !== "paid") {
    return false;
  }
  if (!payment.paymentOption || !isOnlinePaymentOption(payment.paymentOption)) {
    return false;
  }
  return Boolean(payment.stripeSessionId || payment.stripePaymentIntentId);
}

async function resolvePaymentIntentId(
  payment: RefundableBookingPayment,
): Promise<string | null> {
  if (payment.stripePaymentIntentId?.trim()) {
    return payment.stripePaymentIntentId.trim();
  }
  if (!payment.stripeSessionId?.trim()) return null;

  const session = await getStripe().checkout.sessions.retrieve(
    payment.stripeSessionId.trim(),
  );
  const pi = session.payment_intent;
  if (typeof pi === "string") return pi;
  return pi?.id ?? null;
}

/**
 * Devuelve el importe cobrado con tarjeta para esta reserva (reembolso parcial en grupos).
 */
export async function refundBookingStripePayment(
  payment: RefundableBookingPayment,
): Promise<{ refunded: boolean; refundId?: string }> {
  if (!isStripeConfigured()) {
    return { refunded: false };
  }
  if (payment.status === "refunded") {
    return { refunded: false };
  }
  if (!paymentWasChargedOnline(payment)) {
    return { refunded: false };
  }

  const amountCents = payment.amountCents;
  if (amountCents <= 0) {
    return { refunded: false };
  }

  const paymentIntentId = await resolvePaymentIntentId(payment);
  if (!paymentIntentId) {
    throw new Error(
      "No se encontró el pago en Stripe. Contacta con soporte para la devolución.",
    );
  }

  const refund = await getStripe().refunds.create({
    payment_intent: paymentIntentId,
    amount: amountCents,
    reason: "requested_by_customer",
    metadata: {
      source: "coach_reject",
    },
  });

  return { refunded: true, refundId: refund.id };
}
