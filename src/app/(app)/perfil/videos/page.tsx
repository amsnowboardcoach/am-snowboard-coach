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
    <div>
      <Link
        href="/perfil"
        className="text-sm text-zinc-500 hover:text-sky-400"
      >
        ← Mi perfil
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Video corrección</h1>
      <p className="mt-2 text-zinc-400">
        Sube tu vídeo y consulta aquí los apuntes de Alejandro cuando publique la
        corrección.
      </p>
      <p className="mt-2 text-sm text-violet-300/90">
        Análisis profesional: 20 € por vídeo —{" "}
        <Link href="/reservar?tipo=video" className="underline hover:text-violet-200">
          solicitar corrección
        </Link>
      </p>

      <div className="mt-8">
        <StudentVideosPanel studentId={user.uid} />
      </div>
    </div>
  );
}
