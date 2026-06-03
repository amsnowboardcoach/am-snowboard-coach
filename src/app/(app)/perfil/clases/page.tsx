"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AlumnoClassesPanel } from "@/components/perfil/AlumnoClassesPanel";
import { useAuth } from "@/contexts/AuthProvider";
import { isAlumnoProfile, isCoachProfile } from "@/lib/auth/coach-role";

export default function PerfilClasesPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile && isCoachProfile(profile)) {
      router.replace("/coach");
    }
  }, [profile, router]);

  if (!profile || !isAlumnoProfile(profile) || !user?.uid) {
    return (
      <p className="text-sm text-zinc-500">Inicia sesión como alumno para ver tus clases.</p>
    );
  }

  return (
    <div className="content-align-start stack-page w-full max-w-3xl">
      <header>
        <Link href="/perfil" className="text-sm font-medium link-accent">
          ← Volver al perfil
        </Link>
        <h1 className="page-title mt-4">Mis clases</h1>
        <p className="page-lead">
          Reservas en pista: confirmadas, pendientes de confirmación y historial
        </p>
      </header>

      <AlumnoClassesPanel userId={user.uid} />
    </div>
  );
}
