"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookingForm } from "@/components/booking/BookingForm";
import { VideoCorrectionBookingHub } from "@/components/booking/VideoCorrectionBookingHub";
import { cn } from "@/lib/utils/cn";

type Tab = "pista" | "video";

export function ReservarTabs() {
  const searchParams = useSearchParams();
  const tab: Tab = searchParams.get("tipo") === "video" ? "video" : "pista";

  return (
    <div>
      <nav
        className="mb-8 grid grid-cols-2 gap-2 rounded-xl border border-zinc-200/80 bg-zinc-100/80 p-2"
        aria-label="Tipo de reserva"
      >
        <Link
          href="/reservar"
          className={cn(
            "flex min-h-12 items-center justify-center rounded-full px-3 text-center text-sm font-medium transition",
            tab === "pista"
              ? "bg-sky-500 text-zinc-950"
              : "text-zinc-600 hover:text-zinc-900",
          )}
        >
          Clase en pista
        </Link>
        <Link
          href="/reservar?tipo=video"
          className={cn(
            "flex min-h-12 items-center justify-center rounded-full px-3 text-center text-sm font-medium transition",
            tab === "video"
              ? "bg-violet-500 text-zinc-950"
              : "text-zinc-600 hover:text-zinc-900",
          )}
        >
          Video corrección
        </Link>
      </nav>

      {tab === "video" ? <VideoCorrectionBookingHub /> : <BookingForm />}
    </div>
  );
}
