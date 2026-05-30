"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type PayState = "loading" | "redirecting" | "paid" | "pending_coach" | "error";

export default function PagarBookingPage() {
  const params = useParams();
  const bookingId = params.bookingId as string;
  const [state, setState] = useState<PayState>("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/checkout`, {
          method: "POST",
        });
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (res.status === 409 && data.error?.includes("confirmada")) {
          setState("pending_coach");
          setMessage(data.error);
          return;
        }

        if (res.status === 409 && data.error?.includes("pagada")) {
          setState("paid");
          return;
        }

        if (!res.ok || !data.checkoutUrl) {
          setState("error");
          setMessage(
            typeof data.error === "string"
              ? data.error
              : "No se pudo iniciar el pago",
          );
          return;
        }

        setState("redirecting");
        window.location.href = data.checkoutUrl;
      } catch {
        if (!cancelled) {
          setState("error");
          setMessage("Error de conexión. Inténtalo de nuevo.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-20 text-center">
      {state === "loading" || state === "redirecting" ? (
        <>
          <p className="text-lg font-semibold text-sky-300">
            {state === "redirecting"
              ? "Abriendo pago seguro…"
              : "Preparando el pago…"}
          </p>
          <p className="mt-3 text-sm text-zinc-500">
            Serás redirigido a Stripe para pagar con tarjeta.
          </p>
        </>
      ) : null}

      {state === "paid" && (
        <>
          <p className="text-lg font-semibold text-emerald-300">
            Esta clase ya está pagada
          </p>
          <Link href="/perfil" className="mt-6 text-sky-400 hover:underline">
            Ir al área de alumno
          </Link>
        </>
      )}

      {state === "pending_coach" && (
        <>
          <p className="text-lg font-semibold text-amber-200">
            Reserva aún no confirmada
          </p>
          <p className="mt-3 text-sm text-zinc-400">
            {message ??
              "Alejandro debe aceptar tu solicitud antes de poder pagar. Te avisaremos por email."}
          </p>
          <Link href="/reservar" className="mt-6 text-sky-400 hover:underline">
            Volver a reservar
          </Link>
        </>
      )}

      {state === "error" && (
        <>
          <p className="text-lg font-semibold text-red-300">No se pudo pagar</p>
          <p className="mt-3 text-sm text-zinc-400">{message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-zinc-950"
          >
            Reintentar
          </button>
        </>
      )}
    </div>
  );
}
