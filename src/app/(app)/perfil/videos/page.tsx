"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AlumnoVideosPanel } from "@/components/videos/AlumnoVideosPanel";
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
    <div className="content-align-start stack-page w-full">
      <header>
        <h1 className="page-title">Video corrección</h1>
        <p className="page-lead">
          Sube tu vídeo y consulta aquí los apuntes de Alejandro cuando publique la
          corrección.
        </p>
        <p className="mt-3 text-sm text-sky-300/90">
          <Link href="/reservar?tipo=video" className="underline hover:text-sky-200">
            Solicitar video corrección
          </Link>
        </p>
      </header>

      <div>
        <AlumnoVideosPanel alumnoId={user.uid} />
      </div>
    </div>
  );
}
