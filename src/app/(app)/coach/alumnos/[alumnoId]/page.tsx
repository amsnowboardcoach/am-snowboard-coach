"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { CreateBookingForm } from "@/components/coach/CreateBookingForm";
import { CoachAlumnoContentPanel } from "@/components/coach/CoachAlumnoContentPanel";
import { DeleteAlumnoButton } from "@/components/coach/DeleteAlumnoButton";
import { AlumnoLevelSelect } from "@/components/coach/AlumnoLevelSelect";
import { AlumnoTrickManager } from "@/components/coach/AlumnoTrickManager";
import { alumnoLevelLabel } from "@/lib/booking/contact-notes";
import { useAuth } from "@/contexts/AuthProvider";
import { COACH_ROLES } from "@/constants/roles";
import { coachHubHref } from "@/constants/coach-hub";
import { getFirebaseDb } from "@/lib/firebase/client";
import { cn } from "@/lib/utils/cn";
import type { UserProfile } from "@/types/firestore";

type AlumnoAreaTab = "reservar" | "contenido" | "pasaporte";

const TABS: { id: AlumnoAreaTab; label: string }[] = [
  { id: "reservar", label: "Reservar clase" },
  { id: "contenido", label: "Su contenido" },
  { id: "pasaporte", label: "Pasaporte" },
];

export default function CoachAlumnoDetailPage() {
  const params = useParams();
  const alumnoId = params.alumnoId as string;
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [alumno, setAlumno] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AlumnoAreaTab>("reservar");

  useEffect(() => {
    if (authLoading) return;
    if (!profile || !COACH_ROLES.includes(profile.role) || !user) {
      router.replace("/perfil");
      return;
    }

    let active = true;
    (async () => {
      const snap = await getDoc(doc(getFirebaseDb(), "users", alumnoId));
      if (!active) return;
      if (snap.exists()) {
        setAlumno(snap.data() as UserProfile);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [authLoading, profile, router, alumnoId, user]);

  if (loading || authLoading) {
    return <p className="text-zinc-500">Cargando…</p>;
  }

  if (!alumno || !user) {
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
      <h1 className="mt-2 text-2xl font-bold">{alumno.displayName}</h1>
      <p className="text-sm text-zinc-500">{alumno.email}</p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <AlumnoLevelSelect
          alumnoId={alumno.uid}
          value={alumno.level}
          onChange={(level) =>
            setAlumno((prev) => (prev ? { ...prev, level } : prev))
          }
        />
        <p className="pb-2 text-xs text-zinc-500">
          El alumno ve su nivel en{" "}
          <span className="text-zinc-400">{alumnoLevelLabel(alumno.level)}</span>{" "}
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
                ? "chip-toggle-active"
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
              alumnoPrefill={{
                displayName: alumno.displayName,
                email: alumno.email,
                userId: alumno.uid,
              }}
              title={`Reservar clase — ${alumno.displayName}`}
              description="Crea la reserva en el calendario con los mismos turnos que la web pública."
              onCreated={() => {}}
            />
          </section>
        )}

        {activeTab === "contenido" && (
          <CoachAlumnoContentPanel
            alumnoId={alumnoId}
            alumnoName={alumno.displayName}
          />
        )}

        {activeTab === "pasaporte" && (
          <section>
            <p className="mb-4 text-sm text-zinc-400">
              Notas por sección, progreso de trucos y notas por maniobra. Pulsa
              confirmar para que el alumno lo vea en su pasaporte.
            </p>
            <AlumnoTrickManager alumno={alumno} />
          </section>
        )}
      </div>

      <section className="mt-12 rounded-2xl border border-red-500/25 bg-red-500/5 p-6">
        <h2 className="text-lg font-semibold text-red-200">Zona de peligro</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Elimina la cuenta del alumno y todo su contenido. No se puede deshacer.
        </p>
        <DeleteAlumnoButton
          className="mt-4"
          alumnoId={alumnoId}
          alumnoName={alumno.displayName}
          alumnoEmail={alumno.email}
          redirectToList
        />
      </section>
    </div>
  );
}
