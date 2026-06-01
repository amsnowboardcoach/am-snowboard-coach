import type Stripe from "stripe";

/**
 * Solo tarjeta en Checkout: evita Amazon Pay / wallets que cargan scripts con
 * errores CORS en consola (merchantId=undefined) y no los usamos en reservas.
 */
export const BOOKING_CHECKOUT_PAYMENT_OPTIONS = {
  payment_method_types: ["card"],
} satisfies Pick<Stripe.Checkout.SessionCreateParams, "payment_method_types">;
