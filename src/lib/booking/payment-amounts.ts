import {
  BOOKING_BALANCE_PAYMENT_LABEL,
  BOOKING_DEPOSIT_PERCENT,
} from "@/constants/booking-payment";
import type { BookingPaymentOption } from "@/constants/booking-payment";

export function computeBookingPaymentBreakdown(
  totalAmountCents: number,
  paymentOption: BookingPaymentOption,
): {
  totalAmountCents: number;
  chargeAmountCents: number;
  depositAmountCents: number;
  balanceAmountCents: number;
} {
  if (paymentOption === "full_stripe") {
    return {
      totalAmountCents,
      chargeAmountCents: totalAmountCents,
      depositAmountCents: 0,
      balanceAmountCents: 0,
    };
  }
  if (paymentOption === "deposit_30") {
    const depositAmountCents = Math.round(
      (totalAmountCents * BOOKING_DEPOSIT_PERCENT) / 100,
    );
    return {
      totalAmountCents,
      chargeAmountCents: depositAmountCents,
      depositAmountCents,
      balanceAmountCents: totalAmountCents - depositAmountCents,
    };
  }
  return {
    totalAmountCents,
    chargeAmountCents: 0,
    depositAmountCents: 0,
    balanceAmountCents: totalAmountCents,
  };
}

export function formatPaymentBreakdownEuros(
  totalCents: number,
  depositCents: number,
  balanceCents: number,
): string {
  const total = (totalCents / 100).toFixed(0);
  if (depositCents <= 0) return `${total} €`;
  const dep = (depositCents / 100).toFixed(0);
  const bal = (balanceCents / 100).toFixed(0);
  return `${total} € (señal ${dep} € + ${bal} € en ${BOOKING_BALANCE_PAYMENT_LABEL})`;
}
