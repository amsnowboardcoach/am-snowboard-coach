import { NextRequest } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

const COACH_ROLES = new Set(["coach", "collaborator", "admin"]);

export async function verifyCoachRequest(
  request: NextRequest,
): Promise<string | null> {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  try {
    const token = header.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const userSnap = await getAdminDb().collection("users").doc(decoded.uid).get();
    const role = userSnap.data()?.role as string | undefined;
    if (!role || !COACH_ROLES.has(role)) return null;
    return decoded.uid;
  } catch {
    return null;
  }
}
