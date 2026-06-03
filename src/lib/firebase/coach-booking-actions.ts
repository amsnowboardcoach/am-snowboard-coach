import { isFirebaseConfigured } from "@/lib/auth/config";
import { getFirebaseAuth } from "@/lib/firebase/client";

export type CoachBookingActionResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  paymentRefunded?: boolean;
  warnings?: string[];
};

async function coachAuthHeader(): Promise<HeadersInit> {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase no está configurado.");
  }
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Inicia sesión como coach");
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function parseCoachBookingAction(
  res: Response,
): Promise<CoachBookingActionResponse> {
  const data = (await res.json()) as CoachBookingActionResponse;
  if (!res.ok) {
    throw new Error(data.error ?? "Error en la operación");
  }
  return data;
}

export async function confirmBookingApi(
  bookingId: string,
): Promise<CoachBookingActionResponse> {
  const res = await fetch(`/api/bookings/${bookingId}/confirm`, {
    method: "POST",
    headers: await coachAuthHeader(),
  });
  return parseCoachBookingAction(res);
}

export async function rejectBookingApi(
  bookingId: string,
): Promise<CoachBookingActionResponse> {
  const res = await fetch(`/api/bookings/${bookingId}/reject`, {
    method: "POST",
    headers: await coachAuthHeader(),
  });
  return parseCoachBookingAction(res);
}

export async function markBookingPaidApi(
  bookingId: string,
): Promise<CoachBookingActionResponse> {
  const res = await fetch(`/api/bookings/${bookingId}/mark-paid`, {
    method: "POST",
    headers: await coachAuthHeader(),
  });
  return parseCoachBookingAction(res);
}
