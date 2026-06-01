"use client";

import Link from "next/link";
import { CoachWhatsAppCard } from "@/components/contact/CoachWhatsAppCard";
import { DeleteAccountSection } from "@/components/perfil/DeleteAccountSection";
import { useAuth } from "@/contexts/AuthProvider";
import { COACH_ROLES } from "@/constants/roles";

const links = [
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
    href: "/tribu",
    title: "La Tribu",
    desc: "Fotos, vídeos y momentos en la nieve",
    icon: "🔥",
  },
];

export default function PerfilPage() {
  const { user, profile } = useAuth();
  const isStudent = profile && !COACH_ROLES.includes(profile.role);

  return (
    <div className="stack-page">
      <header>
        <h1 className="page-title">
          Hola, {profile?.displayName ?? user?.displayName}
        </h1>
        <p className="page-lead">
          Tu espacio personal: progreso, vídeos y comunidad
        </p>
      </header>

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
          <dd className="capitalize">{profile?.level ?? "Sin definir"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500">Rol</dt>
          <dd>{profile?.role ?? "—"}</dd>
        </div>
      </dl>

      <div className="grid gap-grid sm:grid-cols-3">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 transition hover:border-sky-500/40"
          >
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
