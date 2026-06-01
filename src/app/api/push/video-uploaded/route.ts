import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyUserBearer } from "@/lib/auth/verify-user-token";
import { getAdminDb } from "@/lib/firebase/admin";
import { coachNotifyVideoUploaded } from "@/lib/notify/coach";

export const runtime = "nodejs";

const bodySchema = z.object({
  videoId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const auth = await verifyUserBearer(request);
  if (!auth) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const videoRef = getAdminDb()
    .collection("users")
    .doc(auth.uid)
    .collection("progress_videos")
    .doc(parsed.data.videoId);

  const videoSnap = await videoRef.get();
  if (!videoSnap.exists) {
    return NextResponse.json({ error: "Vídeo no encontrado" }, { status: 404 });
  }

  const video = videoSnap.data()!;
  if (video.studentId !== auth.uid) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const userSnap = await getAdminDb().collection("users").doc(auth.uid).get();
  const studentName =
    (userSnap.data()?.displayName as string) ||
    auth.email.split("@")[0] ||
    "Alumno";
  const studentEmail = (userSnap.data()?.email as string) || auth.email;

  try {
    await coachNotifyVideoUploaded({
      studentName,
      studentEmail,
      videoTitle: (video.title as string) || "Vídeo sin título",
      studentId: auth.uid,
    });
  } catch (err) {
    console.error("[push/video-uploaded]", err);
  }

  return NextResponse.json({ ok: true });
}
