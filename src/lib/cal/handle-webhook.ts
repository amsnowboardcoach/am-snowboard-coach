import { parseCalBookingPayload } from "@/lib/cal/parse-payload";
import {
  FirebaseAdminNotConfiguredError,
  syncBookingFromCalWebhook,
} from "@/lib/firebase/bookings-admin";
import type { CalWebhookBody } from "@/lib/cal/types";

export async function handleCalWebhook(body: CalWebhookBody) {
  const { triggerEvent, payload } = body;

  switch (triggerEvent) {
    case "BOOKING_CREATED":
    case "BOOKING_RESCHEDULED":
    case "BOOKING_REQUESTED":
    case "BOOKING_CANCELLED":
    case "BOOKING_REJECTED": {
      const parsed = parseCalBookingPayload(triggerEvent, payload);
      if (!parsed) {
        return {
          received: true,
          triggerEvent,
          action: "skipped" as const,
          reason: "payload_incomplete",
        };
      }
      const result = await syncBookingFromCalWebhook(triggerEvent, parsed);
      return { received: true, triggerEvent, ...result };
    }
    default:
      return {
        received: true,
        triggerEvent,
        action: "ignored" as const,
      };
  }
}

export { FirebaseAdminNotConfiguredError };
