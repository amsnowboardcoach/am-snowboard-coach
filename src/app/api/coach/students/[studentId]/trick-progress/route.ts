import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyCoachRequest } from "@/lib/auth/verify-coach";
import { assertCoachCanManageStudent } from "@/lib/firebase/coach-student-access";
import { applyPassportSectionNotes } from "@/lib/firebase/passport-section-notes-admin";
import { applyStudentTrickProgressUpdates } from "@/lib/firebase/tricks-admin";
import { notifyStudentPassportUpdated } from "@/lib/push/send-push";

export const runtime = "nodejs";

const updateSchema = z.object({
  trickId: z.string().min(1),
  category: z.enum(["flat", "jumps", "rails", "freeride"]),
  sortOrder: z.number().int().min(0),
  status: z.enum(["locked", "in_progress", "unlocked", "mastered"]),
  coachNotes: z.string().max(500).optional(),
  trickName: z.string().min(1).max(120),
});

const sectionNoteSchema = z.object({
  category: z.enum(["flat", "jumps", "rails", "freeride"]),
  notes: z.string().max(2000),
});

const bodySchema = z
  .object({
    updates: z.array(updateSchema).max(80).optional().default([]),
    sectionNotes: z.array(sectionNoteSchema).max(8).optional().default([]),
  })
  .refine(
    (data) => data.updates.length > 0 || data.sectionNotes.length > 0,
    { message: "Sin cambios que publicar" },
  );

type RouteContext = { params: Promise<{ studentId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const coachUid = await verifyCoachRequest(request);
  if (!coachUid) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { studentId } = await context.params;
  if (!studentId?.trim()) {
    return NextResponse.json({ error: "Alumno no válido" }, { status: 400 });
  }

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

  try {
    await assertCoachCanManageStudent(coachUid, studentId);
    if (parsed.data.updates.length > 0) {
      await applyStudentTrickProgressUpdates(
        studentId,
        coachUid,
        parsed.data.updates,
      );
    }

    if (parsed.data.sectionNotes.length > 0) {
      await applyPassportSectionNotes(
        studentId,
        coachUid,
        parsed.data.sectionNotes,
      );
    }

    const changeCount =
      parsed.data.updates.length + parsed.data.sectionNotes.length;

    if (changeCount > 0) {
      const first = parsed.data.updates[0];
      try {
        await notifyStudentPassportUpdated({
          userId: studentId,
          updateCount: changeCount,
          highlightTrickName:
            parsed.data.updates.length === 1 ? first?.trickName : undefined,
        });
      } catch (pushErr) {
        console.error("[trick-progress] push:", pushErr);
      }
    }

    return NextResponse.json({
      ok: true,
      updated: parsed.data.updates.length,
      sectionNotesUpdated: parsed.data.sectionNotes.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al guardar";
    const status = msg.includes("no encontrado")
      ? 404
      : msg.includes("autorizado") || msg.includes("asignado")
        ? 403
        : 500;
    console.error("[coach/trick-progress]", studentId, err);
    return NextResponse.json({ error: msg }, { status });
  }
}
