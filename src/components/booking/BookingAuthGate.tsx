"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { useAuth } from "@/contexts/AuthProvider";
import { studentAreaHref } from "@/constants/student-area";
import { setBookingPendingSubmit } from "@/lib/booking/booking-draft";
import { cn } from "@/lib/utils/cn";
interface BookingAuthGateProps {
  totalEuros: number;
  /** Importe que se cobra ahora (por defecto = total) */
  chargeEuros?: number;
  summary: string;
  onError?: (message: string | null) => void;
  onGoogleSuccess?: () => void;
  onConfirm?: () => void | Promise<void>;
  confirming?: boolean;
  className?: string;
  /** Título del bloque sin sesión (por defecto: clase en pista) */
  headline?: string;
}

export function BookingAuthGate({
  totalEuros,
  chargeEuros: chargeEurosProp,
  summary,
  onError,
  onGoogleSuccess,
  onConfirm,
  confirming = false,
  className,
  headline = "Tu clase está lista",
}: BookingAuthGateProps) {
  const chargeEuros = chargeEurosProp ?? totalEuros;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuth();

  const returnParams = new URLSearchParams(searchParams.toString());
  returnParams.set("book", "1");
  const returnPath = `${pathname}?${returnParams.toString()}`;

  if (loading || (user?.email && !profile)) {
    return (
      <p className={cn("text-sm text-zinc-500", className)}>
        {user?.email
          ? "Preparando tu cuenta de alumno…"
          : "Comprobando sesión…"}
      </p>
    );
  }

  if (user?.email && profile) {
    const name =
      profile?.displayName?.trim() ||
      user.displayName?.trim() ||
      user.email.split("@")[0];
    return (
      <div
        className={cn(
          "scroll-mt-header rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-5 text-sm",
          className,
        )}
        id="booking-auth-gate"
      >
        <p className="font-medium text-emerald-200">
          Hola {name}, ya puedes confirmar
        </p>
        <p className="mt-1 text-zinc-400">{summary}</p>
        <p className="mt-2 text-lg font-semibold text-sky-300">
          {totalEuros} € total
          {chargeEuros < totalEuros && (
            <span className="mt-0.5 block text-sm font-normal text-zinc-400">
              Pago ahora: {chargeEuros} €
            </span>
          )}
        </p>
        {onConfirm && (
          <button
            type="button"
            disabled={confirming}
            onClick={() => void onConfirm()}
            className="mt-4 w-full rounded-full bg-sky-500 py-3.5 text-sm font-semibold text-zinc-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirming
              ? "Preparando pago…"
              : `Confirmar y pagar ${chargeEuros} €`}
          </button>
        )}
        <p className="mt-3 text-center text-xs text-zinc-500">
          Te llevamos a Stripe para pagar con tarjeta de forma segura.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "scroll-mt-header rounded-2xl border border-sky-500/35 bg-sky-500/10 p-5 sm:p-6",
        className,
      )}
      id="booking-auth-gate"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
        Último paso
      </p>
      <h3 className="mt-2 text-lg font-semibold text-zinc-100">{headline}</h3>
      <p className="mt-1 text-sm text-zinc-400">{summary}</p>
      <p className="mt-2 text-xl font-bold text-sky-300">{totalEuros} €</p>
      <p className="mt-4 text-sm text-zinc-300">
        Entra con tu cuenta de alumno para enviar la solicitud. Tardas menos de
        un minuto.
      </p>
      <div className="mt-4">
        <GoogleAuthButton
          label="Continuar con Google y reservar"
          redirectPath={returnPath}
          onError={onError}
          onBeforeRedirect={() => {
            setBookingPendingSubmit(true);
            onGoogleSuccess?.();
          }}
          onSuccess={() => {
            onGoogleSuccess?.();
          }}
        />
      </div>
      <p className="mt-4 text-center text-sm text-zinc-500">
        <Link
          href={studentAreaHref({ next: returnPath })}
          onClick={() => setBookingPendingSubmit(true)}
          className="font-medium text-sky-400 hover:underline"
        >
          Área de alumno
        </Link>
        <span className="text-zinc-600"> · entrar o registrarte con email</span>
      </p>
    </div>
  );
}
