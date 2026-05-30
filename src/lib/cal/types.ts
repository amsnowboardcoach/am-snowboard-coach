export type CalTriggerEvent =
  | "BOOKING_CREATED"
  | "BOOKING_CANCELLED"
  | "BOOKING_RESCHEDULED"
  | "BOOKING_REQUESTED"
  | "BOOKING_REJECTED"
  | string;

export interface CalAttendee {
  name?: string;
  email?: string;
  timeZone?: string;
}

export interface CalBookingPayload {
  uid?: string;
  bookingId?: number;
  type?: string;
  title?: string;
  eventTitle?: string;
  description?: string;
  additionalNotes?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  length?: number;
  price?: number;
  currency?: string;
  requiresConfirmation?: boolean;
  organizer?: { name?: string; email?: string };
  attendees?: CalAttendee[];
  responses?: {
    name?: { value?: string };
    email?: { value?: string };
    notes?: { value?: string };
  };
}

export interface CalWebhookBody {
  triggerEvent: CalTriggerEvent;
  createdAt?: string;
  payload: CalBookingPayload;
}
