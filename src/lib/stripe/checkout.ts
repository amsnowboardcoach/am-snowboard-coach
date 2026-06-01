import { formatBookingInTimeZone } from "@/lib/booking/format-datetime";
import {
  BOOKING_BALANCE_ON_SLOPE,
  BOOKING_DEPOSIT_PERCENT,
} from "@/constants/booking-payment";
import type { BookingPaymentOption } from "@/constants/booking-payment";
import { BOOKING_MEETING_POINT } from "@/constants/booking-info";
import { getAppBaseUrl } from "@/constants/project";
import type { SessionDuration } from "@/constants/session-schedules";
import { BOOKING_CHECKOUT_PAYMENT_OPTIONS } from "@/lib/stripe/checkout-session-options";
import { getStripe } from "@/lib/stripe/server";

export interface CreateBookingCheckoutInput {
  bookingId: string;
  session?: SessionDuration;
  slotLabel: string;
  lessonTypeName: string;
  studentName: string;
  studentEmail: string;
  startAt: Date;
  amountCents: number;
  participantCount?: number;
  /** Título línea Stripe (ej. Video corrección) */
  productTitle?: string;
  productDescription?: string;
}

export async function createBookingCheckoutSession(
  input: CreateBookingCheckoutInput,
): Promise<string> {
  const stripe = getStripe();
  const base = getAppBaseUrl();
  const when = formatBookingInTimeZone(input.startAt, "EEEE d MMMM yyyy");
  const lineName =
    input.productTitle ??
    (input.session ? `Clase snowboard — ${input.session.name}` : input.lessonTypeName);
  const peopleNote =
    input.participantCount && input.participantCount > 1
      ? ` · ${input.participantCount} personas en pista`
      : "";
  const lineDescription =
    input.productDescription ??
    (input.session
      ? `${input.lessonTypeName} · ${input.slotLabel} · ${when}${peopleNote} · Encuentro: ${BOOKING_MEETING_POINT}. Forfait y material no incluidos; asesoramiento disponible.`
      : `${input.slotLabel} · ${input.lessonTypeName}`);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ...BOOKING_CHECKOUT_PAYMENT_OPTIONS,
    customer_email: input.studentEmail,
    client_reference_id: input.bookingId,
    metadata: {
      bookingId: input.bookingId,
      type: "booking",
      paymentOption: "full_stripe",
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: input.amountCents,
          product_data: {
            name: lineName,
            description: lineDescription,
          },
        },
      },
    ],
    success_url: `${base}/reservar?paid=1&booking=${input.bookingId}`,
    cancel_url: `${base}/reservar?cancelled=1&booking=${input.bookingId}`,
  });

  if (!session.url) {
    throw new Error("Stripe no devolvió URL de pago");
  }
  return session.url;
}

export interface GroupBookingCheckoutInput {
  bookingIds: string[];
  paymentGroupId: string;
  paymentOption: BookingPaymentOption;
  chargeAmountCents: number;
  totalAmountCents: number;
  session: SessionDuration;
  lessonTypeName: string;
  studentName: string;
  studentEmail: string;
  /** Primera clase del grupo (texto Stripe) */
  firstStartAt: Date;
  firstSlotLabel: string;
  participantCount?: number;
  dayCount: number;
}

export async function createGroupBookingCheckoutSession(
  input: GroupBookingCheckoutInput,
): Promise<string> {
  const stripe = getStripe();
  const base = getAppBaseUrl();
  const when = formatBookingInTimeZone(input.firstStartAt, "EEEE d MMMM yyyy");
  const chargeEuros = (input.chargeAmountCents / 100).toFixed(2);
  const totalEuros = (input.totalAmountCents / 100).toFixed(2);

  const isDeposit = input.paymentOption === "deposit_30";
  const lineName = isDeposit
    ? `Señal reserva snowboard (${BOOKING_DEPOSIT_PERCENT}%)`
    : "Clase snowboard — pago completo";

  const peopleNote =
    input.participantCount && input.participantCount > 1
      ? ` · ${input.participantCount} personas`
      : "";
  const daysNote =
    input.dayCount > 1 ? ` · ${input.dayCount} clases` : "";

  const lineDescription = isDeposit
    ? `${input.lessonTypeName} · ${when} · ${input.firstSlotLabel}${peopleNote}${daysNote}. Señal ${chargeEuros} € de ${totalEuros} € total. Resto en ${BOOKING_BALANCE_ON_SLOPE}. Encuentro: ${BOOKING_MEETING_POINT}.`
    : `${input.lessonTypeName} · ${when} · ${input.firstSlotLabel}${peopleNote}${daysNote}. Pago total ${totalEuros} €. Encuentro: ${BOOKING_MEETING_POINT}.`;

  const successParams = new URLSearchParams({
    paid: "1",
    group: input.paymentGroupId,
  });
  if (isDeposit) successParams.set("deposit", "1");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ...BOOKING_CHECKOUT_PAYMENT_OPTIONS,
    customer_email: input.studentEmail,
    client_reference_id: input.bookingIds[0],
    metadata: {
      type: "booking_group",
      bookingIds: input.bookingIds.join(","),
      paymentGroupId: input.paymentGroupId,
      paymentOption: input.paymentOption,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: input.chargeAmountCents,
          product_data: {
            name: lineName,
            description: lineDescription,
          },
        },
      },
    ],
    success_url: `${base}/reservar?${successParams.toString()}`,
    cancel_url: `${base}/reservar?cancelled=1&group=${input.paymentGroupId}`,
  });

  if (!session.url) {
    throw new Error("Stripe no devolvió URL de pago");
  }
  return session.url;
}
