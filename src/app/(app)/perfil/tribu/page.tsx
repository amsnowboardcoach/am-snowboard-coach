"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { StudentTribePanel } from "@/components/tribe/StudentTribePanel";
import { useAuth } from "@/contexts/AuthProvider";
import { isStudentProfile } from "@/lib/auth/coach-role";

export default function PerfilTribuPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/perfil/tribu");
      return;
    }
    if (profile && !isStudentProfile(profile)) {
      router.replace("/coach");
    }
  }, [user, profile, loading, router]);

  if (loading || !user) {
    return <p className="text-zinc-500">Cargando…</p>;
  }

  if (profile && !isStudentProfile(profile)) {
    return null;
  }

  return (
    <div className="content-align-start stack-page w-full">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-sky-400/90">
          Tu panel
        </p>
        <h1 className="page-title">La Tribu</h1>
        <p className="page-lead">
          Comparte momentos en la nieve. Tras enviar, Alejandro revisa tu foto o
          vídeo antes de publicarlo en el feed.
        </p>
        <p className="mt-3 text-sm text-zinc-500">
          <Link href="/tribu#feed" className="link-accent">
            Ver el feed público
          </Link>
        </p>
      </header>

      <StudentTribePanel studentId={user.uid} />
    </div>
  );
}
