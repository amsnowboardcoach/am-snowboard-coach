import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyCoachRequest } from "@/lib/auth/verify-coach";
import { assertCoachCanManageAlumno } from "@/lib/firebase/coach-alumno-access";
import { applyPassportSectionNotes } from "@/lib/firebase/passport-section-notes-admin";
import { applyAlumnoTrickProgressUpdates } from "@/lib/firebase/tricks-admin";
import { notifyAlumnoPassportUpdated } from "@/lib/notify/alumno-passport-updated";

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

type RouteContext = { params: Promise<{ alumnoId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const coachUid = await verifyCoachRequest(request);
  if (!coachUid) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { alumnoId } = await context.params;
  if (!alumnoId?.trim()) {
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
    await assertCoachCanManageAlumno(coachUid, alumnoId);
    if (parsed.data.updates.length > 0) {
      await applyAlumnoTrickProgressUpdates(
        alumnoId,
        coachUid,
        parsed.data.updates,
      );
    }

    if (parsed.data.sectionNotes.length > 0) {
      await applyPassportSectionNotes(
        alumnoId,
        coachUid,
        parsed.data.sectionNotes,
      );
    }

    const trickUpdateCount = parsed.data.updates.length;
    const sectionNoteCount = parsed.data.sectionNotes.length;

    if (trickUpdateCount > 0 || sectionNoteCount > 0) {
      const first = parsed.data.updates[0];
      try {
        await notifyAlumnoPassportUpdated({
          userId: alumnoId,
          trickUpdateCount,
          sectionNoteCount,
          highlightTrickName:
            trickUpdateCount === 1 ? first?.trickName : undefined,
        });
      } catch (notifyErr) {
        console.error("[trick-progress] notify:", notifyErr);
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
    console.error("[coach/trick-progress]", alumnoId, err);
    return NextResponse.json({ error: msg }, { status });
  }
}
