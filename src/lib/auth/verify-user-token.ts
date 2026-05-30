import { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";

export type VerifiedBookingUser = {
  uid: string;
  email: string;
};

/** Usuario alumno autenticado (Bearer Firebase ID token), si viene en la petición. */
export async function verifyUserBearer(
  request: NextRequest,
): Promise<VerifiedBookingUser | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice(7).trim();
  if (!token) {
    return null;
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    const email = decoded.email?.trim().toLowerCase();
    if (!email) {
      return null;
    }
    return { uid: decoded.uid, email };
  } catch {
    return null;
  }
}
