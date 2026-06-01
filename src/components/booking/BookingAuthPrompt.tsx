"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { studentAreaHref } from "@/constants/student-area";
import { useAuth } from "@/contexts/AuthProvider";
export type BookingContact = {
  name: string;
  email: string;
};

interface BookingAuthPromptProps {
  onContact: (contact: BookingContact) => void;
  onError?: (message: string | null) => void;
}

export function BookingAuthPrompt({
  onContact,
  onError,
}: BookingAuthPromptProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuth();

  const returnPath =
    pathname +
    (searchParams.toString() ? `?${searchParams.toString()}` : "");

  useEffect(() => {
    if (loading || !user?.email) {
      return;
    }
    const name =
      profile?.displayName?.trim() ||
      user.displayName?.trim() ||
      user.email.split("@")[0] ||
      "Alumno";
    onContact({ name, email: user.email });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onContact estable desde useCallback del padre
  }, [loading, user?.uid, user?.email, user?.displayName, profile?.displayName]);

  if (loading) {
    return (
      <p className="text-sm text-zinc-500">Comprobando sesión…</p>
    );
  }

  if (user?.email) {
    const name =
      profile?.displayName?.trim() ||
      user.displayName?.trim() ||
      user.email.split("@")[0];
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm">
        <p className="font-medium text-emerald-200">
          Sesión iniciada como {name}
        </p>
        <p className="mt-1 text-zinc-600">{user.email}</p>
        <p className="mt-2 text-zinc-500">
          Esta reserva quedará en{" "}
          <Link href="/perfil" className="text-sky-400 hover:underline">
            tu área de alumno
          </Link>{" "}
          (clases, vídeos y pasaporte).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-sky-500/25 bg-sky-500/5 px-4 py-4">
      <p className="text-sm text-zinc-700">
        Para reservar necesitas una{" "}
        <strong className="font-medium text-zinc-900">cuenta de alumno</strong>.
        Identifícate con Google o crea cuenta con email antes de enviar la
        solicitud.
      </p>
      <GoogleAuthButton
        label="Continuar con Google"
        redirectPath={returnPath}
        onError={onError}
      />
      <p className="text-sm text-zinc-500">
        <Link
          href={studentAreaHref({ next: returnPath })}
          className="text-sky-400 hover:underline"
        >
          Área de alumno
        </Link>
        <span className="text-zinc-600"> · entrar o registrarte con email</span>
      </p>
    </div>
  );
}
