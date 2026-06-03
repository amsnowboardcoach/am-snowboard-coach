import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyCoachRequest } from "@/lib/auth/verify-coach";
import { getAdminDb } from "@/lib/firebase/admin";
import { notifyAlumnoVideoReviewReady } from "@/lib/push/send-push";

export const runtime = "nodejs";

const bodySchema = z.object({
  alumnoId: z.string().min(1),
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

  const coachId = await verifyCoachRequest(request);
  if (!coachId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { alumnoId, videoId } = parsed.data;
  const videoSnap = await getAdminDb()
    .collection("users")
    .doc(alumnoId)
    .collection("progress_videos")
    .doc(videoId)
    .get();

  if (!videoSnap.exists) {
    return NextResponse.json({ error: "Vídeo no encontrado" }, { status: 404 });
  }

  const video = videoSnap.data()!;
  const notes = (video.coachNotes as string)?.trim();
  if (!notes) {
    return NextResponse.json({ error: "Sin apuntes publicados" }, { status: 400 });
  }

  try {
    await notifyAlumnoVideoReviewReady({
      userId: alumnoId,
      videoTitle: (video.title as string) || "Tu vídeo",
    });
  } catch (err) {
    console.error("[push/video-reviewed]", err);
  }

  return NextResponse.json({ ok: true });
}
