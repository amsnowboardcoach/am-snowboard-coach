/** Porcentaje de señal / reserva al contratar */
export const BOOKING_DEPOSIT_PERCENT = 30;

/** Forma de pago del saldo pendiente el día de la clase */
export const BOOKING_BALANCE_PAYMENT_LABEL = "efectivo o Bizum";
export const BOOKING_BALANCE_ON_SLOPE =
  `${BOOKING_BALANCE_PAYMENT_LABEL} en pista`;
export const BOOKING_BALANCE_ON_CLASS_DAY =
  `${BOOKING_BALANCE_PAYMENT_LABEL} el día de la clase`;

export type BookingPaymentOption = "deposit_30" | "full_stripe" | "after_confirm";

export const BOOKING_PAYMENT_OPTIONS: {
  id: BookingPaymentOption;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    id: "deposit_30",
    label: "Señal 30% ahora (tarjeta)",
    shortLabel: "Señal 30%",
    description:
      `Pagas el 30% ahora con tarjeta para reservar la plaza. El resto en ${BOOKING_BALANCE_ON_CLASS_DAY}.`,
  },
  {
    id: "full_stripe",
    label: "Pago completo ahora (tarjeta)",
    shortLabel: "100% tarjeta",
    description: "Pagas el importe total ahora con tarjeta. Nada pendiente en pista.",
  },
];

export function isOnlinePaymentOption(
  option: BookingPaymentOption,
): boolean {
  return option === "deposit_30" || option === "full_stripe";
}
