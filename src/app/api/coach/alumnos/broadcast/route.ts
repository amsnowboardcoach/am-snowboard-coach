import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyCoachRequest } from "@/lib/auth/verify-coach";
import {
  COACH_BROADCAST_TEMPLATE_IDS,
  findCoachBroadcastTemplate,
} from "@/constants/coach-alumno-messages";
import { assertCoachCanManageAlumno } from "@/lib/firebase/coach-alumno-access";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendAlumnoBroadcastEmail } from "@/lib/email/send-alumno-broadcast";
import { isEmailConfigured } from "@/lib/email/send-booking";
import { saveCoachNoticeForAlumno } from "@/lib/firebase/coach-notices-admin";
import { sendPushToUser } from "@/lib/push/send-push";

export const runtime = "nodejs";

const bodySchema = z.object({
  alumnoIds: z.array(z.string().min(1)).min(1).max(80),
  templateId: z.enum(COACH_BROADCAST_TEMPLATE_IDS),
  customTitle: z.string().min(1).max(100).optional(),
  customBody: z.string().min(1).max(800).optional(),
  sendPush: z.boolean().optional().default(true),
  sendEmail: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  const coachUid = await verifyCoachRequest(request);
  if (!coachUid) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const { alumnoIds, templateId, customTitle, customBody, sendPush, sendEmail } =
    parsed.data;

  let title: string;
  let body: string;

  if (templateId === "custom") {
    if (!customTitle?.trim() || !customBody?.trim()) {
      return NextResponse.json(
        { error: "Escribe título y mensaje para el aviso personalizado" },
        { status: 400 },
      );
    }
    title = customTitle.trim();
    body = customBody.trim();
  } else {
    const template = findCoachBroadcastTemplate(templateId);
    if (!template) {
      return NextResponse.json({ error: "Plantilla no válida" }, { status: 400 });
    }
    title = template.title;
    body = template.body;
  }

  if (!sendPush && !sendEmail) {
    return NextResponse.json(
      { error: "Activa al menos push o email" },
      { status: 400 },
    );
  }

  if (sendEmail && !isEmailConfigured()) {
    return NextResponse.json(
      { error: "Email no configurado en el servidor (SMTP)" },
      { status: 503 },
    );
  }

  const db = getAdminDb();
  const uniqueIds = [...new Set(alumnoIds)];
  const results: {
    alumnoId: string;
    push: boolean;
    email: boolean;
    error?: string;
  }[] = [];

  for (const alumnoId of uniqueIds) {
    try {
      await assertCoachCanManageAlumno(coachUid, alumnoId);
      const snap = await db.collection("users").doc(alumnoId).get();
      if (!snap.exists) {
        results.push({
          alumnoId,
          push: false,
          email: false,
          error: "Alumno no encontrado",
        });
        continue;
      }

      const data = snap.data()!;
      const alumnoName =
        (data.displayName as string | undefined)?.trim() || "Alumno";
      const alumnoEmail = (data.email as string | undefined)?.trim() || "";

      let pushOk = false;
      let emailOk = false;
      let savedNotice = false;

      try {
        await saveCoachNoticeForAlumno({
          alumnoId,
          title,
          body,
          templateId,
          coachId: coachUid,
        });
        savedNotice = true;
      } catch (noticeErr) {
        console.error("[broadcast] save notice", alumnoId, noticeErr);
      }

      if (sendPush) {
        try {
          await sendPushToUser(alumnoId, {
            title,
            body,
            url: "/perfil/avisos",
            tag: `coach-broadcast-${templateId}`,
          });
          pushOk = true;
        } catch (pushErr) {
          console.error("[broadcast] push", alumnoId, pushErr);
        }
      }

      if (sendEmail && alumnoEmail) {
        try {
          await sendAlumnoBroadcastEmail({
            alumnoName,
            alumnoEmail,
            title,
            body,
          });
          emailOk = true;
        } catch (emailErr) {
          console.error("[broadcast] email", alumnoId, emailErr);
        }
      }

      const emailWarning =
        sendEmail && !alumnoEmail && !savedNotice
          ? "Sin email en el perfil"
          : undefined;

      if (!savedNotice && !pushOk && !emailOk) {
        results.push({
          alumnoId,
          push: false,
          email: false,
          error: "No se pudo guardar ni enviar el aviso",
        });
        continue;
      }

      results.push({
        alumnoId,
        push: pushOk,
        email: emailOk,
        ...(emailWarning ? { error: emailWarning } : {}),
      });
    } catch (err) {
      results.push({
        alumnoId,
        push: false,
        email: false,
        error: err instanceof Error ? err.message : "Error al enviar",
      });
    }
  }

  const sent = results.filter((r) => !r.error).length;
  const failed = results.filter((r) => r.error);

  return NextResponse.json({
    ok: sent > 0,
    sent,
    total: uniqueIds.length,
    title,
    results,
    failedCount: failed.length,
  });
}
