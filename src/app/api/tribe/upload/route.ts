import { NextRequest, NextResponse } from "next/server";
import { verifyAlumnoBearer } from "@/lib/auth/verify-alumno";
import { adminCreateTribePost } from "@/lib/firebase/tribe-posts-admin";
import { validateTribeMediaFile } from "@/lib/firebase/tribe-posts";
import { isTribeShareableTrickStatus } from "@/constants/trick-status";
import type { TribeMediaType, TribePassportShareMeta } from "@/types/tribe-post";
import type { TrickStatus } from "@/types/tricks";

export const runtime = "nodejs";

const MAX_API_BYTES = 4 * 1024 * 1024;

function parseMediaType(raw: FormDataEntryValue | null): TribeMediaType | null {
  if (raw === "photo" || raw === "video") return raw;
  return null;
}

export async function POST(request: NextRequest) {
  const alumno = await verifyAlumnoBearer(request);
  if (!alumno) {
    return NextResponse.json(
      {
        error:
          "No tienes permiso para subir. Cierra sesión, vuelve a entrar como alumno e inténtalo de nuevo.",
      },
      { status: 403 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo" }, { status: 400 });
  }

  const mediaType = parseMediaType(form.get("mediaType"));
  if (!mediaType) {
    return NextResponse.json({ error: "Tipo de medio inválido" }, { status: 400 });
  }

  const legalConsent = form.get("legalConsent") === "true";
  if (!legalConsent) {
    return NextResponse.json(
      { error: "Debes aceptar las condiciones de publicación." },
      { status: 400 },
    );
  }

  if (file.size > MAX_API_BYTES) {
    return NextResponse.json(
      {
        error: "Archivo demasiado grande para esta vía",
        code: "payload_too_large",
      },
      { status: 413 },
    );
  }

  const validation = validateTribeMediaFile(file, mediaType);
  if (validation) {
    return NextResponse.json({ error: validation }, { status: 400 });
  }

  const caption = form.get("caption");
  const captionStr =
    typeof caption === "string" ? caption.trim().slice(0, 500) : undefined;

  let passport: TribePassportShareMeta | undefined;
  const postKind = form.get("postKind");
  if (postKind === "passport") {
    const trickId = form.get("passportTrickId");
    const trickName = form.get("passportTrickName");
    const trickStatus = form.get("passportTrickStatus");
    if (
      typeof trickId !== "string" ||
      !trickId.trim() ||
      typeof trickName !== "string" ||
      !trickName.trim() ||
      typeof trickStatus !== "string" ||
      !isTribeShareableTrickStatus(trickStatus as TrickStatus)
    ) {
      return NextResponse.json(
        { error: "Datos del logro del pasaporte inválidos." },
        { status: 400 },
      );
    }
    passport = {
      trickId: trickId.trim().slice(0, 80),
      trickName: trickName.trim().slice(0, 120),
      trickStatus: trickStatus as TrickStatus,
    };
    if (mediaType !== "photo") {
      return NextResponse.json(
        { error: "Los logros del pasaporte solo se publican como foto." },
        { status: 400 },
      );
    }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const postId = await adminCreateTribePost({
      authorId: alumno.uid,
      authorDisplayName: alumno.displayName,
      authorPhotoURL: alumno.authorPhotoURL,
      fileBuffer: buffer,
      fileName: file.name || (mediaType === "photo" ? "foto.jpg" : "video.mp4"),
      mediaType,
      caption: captionStr,
      passport,
    });
    return NextResponse.json({ postId });
  } catch (err) {
    console.error("[api/tribe/upload]", err);
    return NextResponse.json(
      { error: "No se pudo guardar la publicación. Inténtalo de nuevo." },
      { status: 500 },
    );
  }
}
