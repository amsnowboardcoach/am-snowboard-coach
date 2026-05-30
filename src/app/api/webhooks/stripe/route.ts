import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  markBookingPaidFromStripe,
  markBookingsPaidFromStripe,
} from "@/lib/firebase/bookings-admin";
import { getStripeWebhookSecret } from "@/lib/stripe/config";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  const paymentOption =
    (session.metadata?.paymentOption as "deposit_30" | "full_stripe") ??
    "full_stripe";

  if (session.metadata?.type === "booking_group") {
    const bookingIds = (session.metadata.bookingIds ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    if (bookingIds.length === 0) {
      console.warn("[stripe webhook] grupo sin bookingIds");
      return;
    }
    await markBookingsPaidFromStripe({
      bookingIds,
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
      paymentOption,
    });
    return;
  }

  const bookingId =
    session.metadata?.bookingId ?? session.client_reference_id ?? "";
  if (!bookingId) {
    console.warn("[stripe webhook] checkout sin bookingId");
    return;
  }

  await markBookingPaidFromStripe({
    bookingId,
    stripeSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    paymentOption,
  });
}

export async function POST(request: Request) {
  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET no configurado" },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Sin firma" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] firma inválida:", err);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          await handleCheckoutCompleted(session);
        }
        break;
      }
      case "checkout.session.async_payment_succeeded": {
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook]", event.type, err);
    return NextResponse.json({ error: "Error procesando evento" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
