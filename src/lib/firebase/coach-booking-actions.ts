import { getFirebaseAuth } from "@/lib/firebase/client";

async function coachAuthHeader(): Promise<HeadersInit> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Inicia sesión como coach");
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function confirmBookingApi(bookingId: string): Promise<void> {
  const res = await fetch(`/api/bookings/${bookingId}/confirm`, {
    method: "POST",
    headers: await coachAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "No se pudo confirmar");
}

export async function rejectBookingApi(bookingId: string): Promise<void> {
  const res = await fetch(`/api/bookings/${bookingId}/reject`, {
    method: "POST",
    headers: await coachAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "No se pudo rechazar");
}

export async function markBookingPaidApi(bookingId: string): Promise<void> {
  const res = await fetch(`/api/bookings/${bookingId}/mark-paid`, {
    method: "POST",
    headers: await coachAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "No se pudo registrar el pago");
}
