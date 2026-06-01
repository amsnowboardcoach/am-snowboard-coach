import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyCoachRequest } from "@/lib/auth/verify-coach";
import {
  COACH_BROADCAST_TEMPLATE_IDS,
  findCoachBroadcastTemplate,
} from "@/constants/coach-student-messages";
import { assertCoachCanManageStudent } from "@/lib/firebase/coach-student-access";
import { getAdminDb } from "@/lib/firebase/admin";
import { sendStudentBroadcastEmail } from "@/lib/email/send-student-broadcast";
import { isEmailConfigured } from "@/lib/email/send-booking";
import { saveCoachNoticeForStudent } from "@/lib/firebase/coach-notices-admin";
import { sendPushToUser } from "@/lib/push/send-push";

export const runtime = "nodejs";

const bodySchema = z.object({
  studentIds: z.array(z.string().min(1)).min(1).max(80),
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

  const { studentIds, templateId, customTitle, customBody, sendPush, sendEmail } =
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
  const uniqueIds = [...new Set(studentIds)];
  const results: {
    studentId: string;
    push: boolean;
    email: boolean;
    error?: string;
  }[] = [];

  for (const studentId of uniqueIds) {
    try {
      await assertCoachCanManageStudent(coachUid, studentId);
      const snap = await db.collection("users").doc(studentId).get();
      if (!snap.exists) {
        results.push({
          studentId,
          push: false,
          email: false,
          error: "Alumno no encontrado",
        });
        continue;
      }

      const data = snap.data()!;
      const studentName =
        (data.displayName as string | undefined)?.trim() || "Alumno";
      const studentEmail = (data.email as string | undefined)?.trim() || "";

      let pushOk = false;
      let emailOk = false;
      let savedNotice = false;

      try {
        await saveCoachNoticeForStudent({
          studentId,
          title,
          body,
          templateId,
          coachId: coachUid,
        });
        savedNotice = true;
      } catch (noticeErr) {
        console.error("[broadcast] save notice", studentId, noticeErr);
      }

      if (sendPush) {
        try {
          await sendPushToUser(studentId, {
            title,
            body,
            url: "/perfil/avisos",
            tag: `coach-broadcast-${templateId}`,
          });
          pushOk = true;
        } catch (pushErr) {
          console.error("[broadcast] push", studentId, pushErr);
        }
      }

      if (sendEmail && studentEmail) {
        try {
          await sendStudentBroadcastEmail({
            studentName,
            studentEmail,
            title,
            body,
          });
          emailOk = true;
        } catch (emailErr) {
          console.error("[broadcast] email", studentId, emailErr);
        }
      }

      const emailWarning =
        sendEmail && !studentEmail && !savedNotice
          ? "Sin email en el perfil"
          : undefined;

      if (!savedNotice && !pushOk && !emailOk) {
        results.push({
          studentId,
          push: false,
          email: false,
          error: "No se pudo guardar ni enviar el aviso",
        });
        continue;
      }

      results.push({
        studentId,
        push: pushOk,
        email: emailOk,
        ...(emailWarning ? { error: emailWarning } : {}),
      });
    } catch (err) {
      results.push({
        studentId,
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
