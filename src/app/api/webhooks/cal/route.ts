import { NextResponse } from "next/server";

/** Cal.com ya no se usa; las reservas van por Google Calendar + web */
export async function POST() {
  return NextResponse.json(
    { error: "Cal.com desactivado. Usa la central de reservas en /reservar." },
    { status: 410 },
  );
}
