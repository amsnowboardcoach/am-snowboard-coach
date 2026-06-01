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
        className="nav-tabs mb-8 grid-cols-2"
        aria-label="Tipo de reserva"
      >
        <Link
          href="/reservar"
          className={cn(
            "flex min-h-12 items-center justify-center rounded-full px-3 text-center text-sm font-medium transition",
            tab === "pista"
              ? "nav-tab-active"
              : "nav-tab-inactive",
          )}
        >
          Clase en pista
        </Link>
        <Link
          href="/reservar?tipo=video"
          className={cn(
            "flex min-h-12 items-center justify-center rounded-full px-3 text-center text-sm font-medium transition",
            tab === "video"
              ? "nav-tab-active"
              : "nav-tab-inactive",
          )}
        >
          Video corrección
        </Link>
      </nav>

      {tab === "video" ? <VideoCorrectionBookingHub /> : <BookingForm />}
    </div>
  );
}
