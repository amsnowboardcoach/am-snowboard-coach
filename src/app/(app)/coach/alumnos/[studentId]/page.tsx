"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { CreateBookingForm } from "@/components/coach/CreateBookingForm";
import { CoachStudentContentPanel } from "@/components/coach/CoachStudentContentPanel";
import { DeleteStudentButton } from "@/components/coach/DeleteStudentButton";
import { StudentLevelSelect } from "@/components/coach/StudentLevelSelect";
import { StudentTrickManager } from "@/components/coach/StudentTrickManager";
import { studentLevelLabel } from "@/lib/booking/contact-notes";
import { useAuth } from "@/contexts/AuthProvider";
import { COACH_ROLES } from "@/constants/roles";
import { coachHubHref } from "@/constants/coach-hub";
import { getFirebaseDb } from "@/lib/firebase/client";
import { cn } from "@/lib/utils/cn";
import type { UserProfile } from "@/types/firestore";

type StudentAreaTab = "reservar" | "contenido" | "pasaporte";

const TABS: { id: StudentAreaTab; label: string }[] = [
  { id: "reservar", label: "Reservar clase" },
  { id: "contenido", label: "Su contenido" },
  { id: "pasaporte", label: "Pasaporte" },
];

export default function CoachAlumnoDetailPage() {
  const params = useParams();
  const studentId = params.studentId as string;
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [student, setStudent] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StudentAreaTab>("reservar");

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
        <Link href={coachHubHref("alumnos")} className="text-sky-400 underline">
          Volver a alumnos
        </Link>
      </p>
    );
  }

  return (
    <div>
      <p className="text-sm">
        <Link
          href={coachHubHref("alumnos")}
          className="text-zinc-500 hover:text-sky-400"
        >
          ← Alumnos
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-bold">{student.displayName}</h1>
      <p className="text-sm text-zinc-500">{student.email}</p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <StudentLevelSelect
          studentId={student.uid}
          value={student.level}
          onChange={(level) =>
            setStudent((prev) => (prev ? { ...prev, level } : prev))
          }
        />
        <p className="pb-2 text-xs text-zinc-600">
          El alumno ve su nivel en{" "}
          <span className="text-zinc-400">{studentLevelLabel(student.level)}</span>{" "}
          en su perfil.
        </p>
      </div>

      <nav
        className="mt-6 grid grid-cols-3 gap-2"
        aria-label="Secciones del alumno"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? "page" : undefined}
            className={cn(
              "min-h-11 touch-manipulation rounded-xl px-2 py-2.5 text-center text-xs font-medium sm:text-sm",
              activeTab === tab.id
                ? "bg-sky-500 text-zinc-950"
                : "border border-zinc-800 text-zinc-400 hover:border-zinc-600",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div key={activeTab} className="mt-8">
        {activeTab === "reservar" && (
          <section>
            <CreateBookingForm
              coachId={user.uid}
              defaultOpen
              studentPrefill={{
                displayName: student.displayName,
                email: student.email,
                userId: student.uid,
              }}
              title={`Reservar clase — ${student.displayName}`}
              description="Crea la reserva en el calendario con los mismos turnos que la web pública."
              onCreated={() => {}}
            />
          </section>
        )}

        {activeTab === "contenido" && (
          <CoachStudentContentPanel
            studentId={studentId}
            studentName={student.displayName}
          />
        )}

        {activeTab === "pasaporte" && (
          <section>
            <p className="mb-4 text-sm text-zinc-400">
              Notas por sección, progreso de trucos y notas por maniobra. Pulsa
              confirmar para que el alumno lo vea en su pasaporte.
            </p>
            <StudentTrickManager student={student} />
          </section>
        )}
      </div>

      <section className="mt-12 rounded-2xl border border-red-500/25 bg-red-500/5 p-6">
        <h2 className="text-lg font-semibold text-red-200">Zona de peligro</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Elimina la cuenta del alumno y todo su contenido. No se puede deshacer.
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
