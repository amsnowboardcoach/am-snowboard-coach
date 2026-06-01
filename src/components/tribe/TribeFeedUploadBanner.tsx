"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { COACH_ROLES } from "@/constants/roles";
import { isStudentProfile } from "@/lib/auth/coach-role";

/** En el feed público no se sube: redirige al panel del alumno o al login. */
export function TribeFeedUploadBanner() {
  const { user, profile, loading } = useAuth();

  if (loading) return null;

  const isStudent =
    Boolean(user && !user.isAnonymous && profile && isStudentProfile(profile));

  if (isStudent) {
    return (
      <div className="glass-panel flex flex-col items-center gap-4 rounded-2xl p-5 text-center sm:flex-row sm:items-center sm:justify-between sm:p-6 sm:text-left">
        <div>
          <p className="font-semibold text-zinc-100">¿Quieres publicar?</p>
          <p className="mt-1 text-sm text-zinc-400">
            Las fotos y vídeos se suben solo desde tu panel de alumno. El coach
            los revisa antes de que salgan aquí.
          </p>
        </div>
        <Link href="/perfil/tribu" className="btn-primary-md sm:shrink-0">
          Subir desde mi perfil
        </Link>
      </div>
    );
  }

  if (user && profile && COACH_ROLES.includes(profile.role)) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 px-5 py-4 text-sm text-zinc-400">
        Las publicaciones de alumnos se aprueban en el{" "}
        <Link
          href="/coach?tab=tribu"
          className="font-medium link-accent"
        >
          panel del coach
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 text-center sm:p-8">
      <p className="text-lg font-semibold text-zinc-100">Publicar en La Tribu</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
        Solo <strong className="font-medium text-zinc-200">alumnos registrados</strong>{" "}
        pueden subir contenido, y lo hacen desde el área de alumno. Aquí puedes ver
        el feed, reaccionar y comentar.
      </p>
      <Link
        href="/login"
        className="btn-primary-md mt-6"
      >
        Entrar al área de alumno
      </Link>
      <p className="mt-3 text-xs text-zinc-500">
        ¿Primera vez?{" "}
        <Link href="/registro" className="link-accent underline-offset-2 hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
