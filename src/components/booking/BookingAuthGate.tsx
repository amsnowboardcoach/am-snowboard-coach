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
}

export function BookingAuthGate({
  totalEuros,
  summary,
  onError,
  onGoogleSuccess,
  className,
}: BookingAuthGateProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuth();

  const returnParams = new URLSearchParams(searchParams.toString());
  returnParams.set("book", "1");
  const returnPath = `${pathname}?${returnParams.toString()}`;

  if (loading) {
    return (
      <p className={cn("text-sm text-zinc-500", className)}>
        Comprobando sesión…
      </p>
    );
  }

  if (user?.email) {
    const name =
      profile?.displayName?.trim() ||
      user.displayName?.trim() ||
      user.email.split("@")[0];
    return (
      <div
        className={cn(
          "rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm",
          className,
        )}
      >
        <p className="font-medium text-emerald-200">
          Hola {name}, confirma tu solicitud
        </p>
        <p className="mt-1 text-zinc-400">{summary}</p>
        <p className="mt-2 text-lg font-semibold text-sky-300">{totalEuros} €</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-sky-500/35 bg-sky-500/10 p-5 sm:p-6",
        className,
      )}
      id="booking-auth-gate"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">
        Último paso
      </p>
      <h3 className="mt-2 text-lg font-semibold text-zinc-100">
        Tu clase está lista
      </h3>
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
          className="font-medium text-sky-400 hover:underline"
        >
          Área de alumno
        </Link>
        <span className="text-zinc-600"> · entrar o registrarte con email</span>
      </p>
    </div>
  );
}
