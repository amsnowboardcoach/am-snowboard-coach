"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { StudentNoticesPanel } from "@/components/perfil/StudentNoticesPanel";
import { useAuth } from "@/contexts/AuthProvider";
import { isStudentProfile } from "@/lib/auth/coach-role";

export default function PerfilAvisosPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile && !isStudentProfile(profile)) {
      router.replace("/coach");
    }
  }, [profile, router]);

  if (!user?.uid) {
    return <p className="text-zinc-500">Cargando…</p>;
  }

  return (
    <div className="content-align-start stack-page w-full">
      <p className="text-sm">
        <Link href="/perfil" className="text-zinc-500 hover:text-sky-400">
          ← Perfil
        </Link>
      </p>
      <header>
        <h1 className="page-title">Avisos del coach</h1>
        <p className="page-lead">
          Mensajes de Alejandro: estación cerrada, retrasos de apertura, cambios
          de punto de encuentro y otros avisos importantes.
        </p>
      </header>
      <StudentNoticesPanel studentId={user.uid} />
    </div>
  );
}
