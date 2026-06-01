"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CoachWhatsAppCard } from "@/components/contact/CoachWhatsAppCard";
import { DeleteAccountSection } from "@/components/perfil/DeleteAccountSection";
import { StudentNoticesPanel } from "@/components/perfil/StudentNoticesPanel";
import { StudentNoticesUnreadBadge } from "@/components/perfil/StudentNoticesUnreadBadge";
import { useAuth } from "@/contexts/AuthProvider";
import { isStudentProfile } from "@/lib/auth/coach-role";
import { studentLevelLabel } from "@/lib/booking/contact-notes";

type PerfilLink = {
  href: string;
  title: string;
  desc: string;
  icon: string;
  showUnreadBadge?: boolean;
};

const links: PerfilLink[] = [
  {
    href: "/perfil/avisos",
    title: "Avisos del coach",
    desc: "Estación cerrada, retrasos y mensajes de Alejandro",
    icon: "📢",
    showUnreadBadge: true,
  },
  {
    href: "/perfil/pasaporte",
    title: "Pasaporte de Trucos",
    desc: "Trucos validados por Alejandro en tus clases",
    icon: "🎿",
  },
  {
    href: "/perfil/videos",
    title: "Video corrección",
    desc: "Sube tu riding y lee las correcciones del coach",
    icon: "🎬",
  },
  {
    href: "/perfil/tribu",
    title: "La Tribu",
    desc: "Sube fotos y vídeos · revisión del coach",
    icon: "🔥",
  },
];

export default function PerfilPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const isStudent = profile ? isStudentProfile(profile) : false;

  useEffect(() => {
    if (profile && !isStudentProfile(profile)) {
      router.replace("/coach");
    }
  }, [profile, router]);

  return (
    <div className="content-align-start stack-page w-full">
      <header className="w-full">
        <h1 className="page-title">
          Hola, {profile?.displayName ?? user?.displayName}
        </h1>
        <p className="page-lead">
          Tu espacio personal: progreso, vídeos y comunidad
        </p>
      </header>

      {isStudent && user?.uid && (
        <section className="glass-panel rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-100">
              Últimos avisos
            </h2>
            <Link
              href="/perfil/avisos"
              className="text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              Ver todos →
            </Link>
          </div>
          <div className="mt-4">
            <StudentNoticesPanel studentId={user.uid} compact />
          </div>
        </section>
      )}

      {isStudent && (
        <CoachWhatsAppCard
          className=""
          prefill={`Hola Alejandro, soy ${profile?.displayName ?? "alumno AM"}. `}
        />
      )}

      <dl className="grid gap-4 text-sm sm:grid-cols-3 sm:gap-6">
        <div>
          <dt className="text-zinc-500">Email</dt>
          <dd>{profile?.email ?? user?.email}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Nivel</dt>
          <dd>{studentLevelLabel(profile?.level)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Rol</dt>
          <dd>{profile?.role ?? "—"}</dd>
        </div>
      </dl>

      <div className="content-align-start grid w-full max-w-3xl gap-grid sm:grid-cols-3">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-sky-500/40"
          >
            {item.showUnreadBadge && user?.uid && (
              <StudentNoticesUnreadBadge
                studentId={user.uid}
                className="absolute right-4 top-4"
              />
            )}
            <span className="text-2xl">{item.icon}</span>
            <h2 className="mt-3 font-semibold">{item.title}</h2>
            <p className="mt-1 text-sm text-zinc-500">{item.desc}</p>
          </Link>
        ))}
      </div>

      {isStudent && <DeleteAccountSection />}
    </div>
  );
}
