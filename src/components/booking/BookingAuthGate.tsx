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
  summary: string;
  onError?: (message: string | null) => void;
  onGoogleSuccess?: () => void;
  className?: string;
  /** Título del bloque sin sesión (por defecto: clase en pista) */
  headline?: string;
}

export function BookingAuthGate({
  totalEuros,
  summary,
  onError,
  onGoogleSuccess,
  className,
  headline = "Tu clase está lista",
}: BookingAuthGateProps) {
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
    return null;
  }

  return (
    <div
      className={cn(
        "scroll-mt-header panel-highlight p-5 sm:p-6",
        className,
      )}
      id="booking-auth-gate"
    >
      <p className="page-eyebrow">Último paso</p>
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
          className="font-medium link-accent underline-offset-2 hover:underline"
        >
          Área de alumno
        </Link>
        <span className="text-zinc-500"> · entrar o registrarte con email</span>
      </p>
    </div>
  );
}
