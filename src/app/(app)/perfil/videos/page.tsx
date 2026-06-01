"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { StudentVideosPanel } from "@/components/videos/StudentVideosPanel";
import { useAuth } from "@/contexts/AuthProvider";

export default function VideosPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return <p className="text-zinc-500">Cargando…</p>;
  }

  return (
    <div className="stack-page">
      <header>
        <h1 className="page-title">Video corrección</h1>
        <p className="page-lead">
          Sube tu vídeo y consulta aquí los apuntes de Alejandro cuando publique la
          corrección.
        </p>
        <p className="mt-3 text-sm text-violet-300/90">
          <Link href="/reservar?tipo=video" className="underline hover:text-violet-200">
            Solicitar video corrección
          </Link>
        </p>
      </header>

      <div>
        <StudentVideosPanel studentId={user.uid} />
      </div>
    </div>
  );
}
