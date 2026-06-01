"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { DeleteStudentButton } from "@/components/coach/DeleteStudentButton";
import { CoachVideoReviewPanel } from "@/components/videos/CoachVideoReviewPanel";
import { StudentTrickManager } from "@/components/coach/StudentTrickManager";
import { useAuth } from "@/contexts/AuthProvider";
import { coachHubHref } from "@/constants/coach-hub";
import { COACH_ROLES } from "@/constants/roles";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { UserProfile } from "@/types/firestore";

export default function CoachAlumnoDetailPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [student, setStudent] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!profile || !COACH_ROLES.includes(profile.role) || !user) {
      router.replace("/perfil");
      return;
    }

    let active = true;
    (async () => {
      const snap = await getDoc(doc(getFirebaseDb(), "users", studentId));
      if (!active) return;
      if (snap.exists()) {
        setStudent(snap.data() as UserProfile);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [authLoading, profile, router, studentId, user]);

  if (loading || authLoading) {
    return <p className="text-zinc-500">Cargando…</p>;
  }

  if (!student || !user) {
    return (
      <p className="text-zinc-400">
        Alumno no encontrado.{" "}
        <Link href={coachHubHref("alumnos")} className="text-sky-400">
          Volver
        </Link>
      </p>
    );
  }

  return (
    <div>
      <Link
        href={coachHubHref("alumnos")}
        className="text-sm text-zinc-500 hover:text-sky-400"
      >
        ← Alumnos
      </Link>
      <h1 className="mt-4 text-2xl font-bold">{student.displayName}</h1>
      <p className="text-sm text-zinc-500">{student.email}</p>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold">Video corrección</h2>
        <CoachVideoReviewPanel studentId={studentId} />
      </section>

      <section className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Pasaporte de Trucos</h2>
        <StudentTrickManager student={student} coachId={user.uid} />
      </section>

      <section className="mt-12 rounded-2xl border border-red-500/25 bg-red-500/5 p-6">
        <h2 className="text-lg font-semibold text-red-200">Zona de peligro</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Elimina la cuenta del alumno y todo su contenido (vídeos, Tribu,
          reservas, etc.). No se puede deshacer.
        </p>
        <DeleteStudentButton
          className="mt-4"
          studentId={studentId}
          studentName={student.displayName}
          studentEmail={student.email}
          redirectToList
        />
      </section>
    </div>
  );
}
