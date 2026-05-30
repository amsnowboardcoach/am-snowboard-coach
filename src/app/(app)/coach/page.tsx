"use client";

import { useAuth } from "@/contexts/AuthProvider";
import { COACH_ROLES } from "@/constants/roles";
import { CoachHubShell } from "@/components/coach/CoachHubShell";
import { CoachProfileSetup } from "@/components/coach/CoachProfileSetup";
import { isCoachEmail } from "@/lib/auth/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CoachDashboardPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const isCoachRole = profile && COACH_ROLES.includes(profile.role);
  const isCoachByEmail = user?.email ? isCoachEmail(user.email) : false;

  useEffect(() => {
    if (loading || !user) return;
    if (profile && !COACH_ROLES.includes(profile.role) && !isCoachByEmail) {
      router.replace("/perfil");
    }
  }, [profile, loading, router, user, isCoachByEmail]);

  if (loading) {
    return <p className="text-zinc-500">Cargando panel…</p>;
  }

  if (!user) {
    return null;
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Panel del Coach</h1>
        <CoachProfileSetup user={user} onReady={() => {}} />
      </div>
    );
  }

  if (!isCoachRole && isCoachByEmail) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Panel del Coach</h1>
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
          <p className="text-sm text-amber-200">
            Tu perfil tiene rol <strong>{profile.role}</strong> pero tu email es
            de coach. En Firebase Console → Firestore →{" "}
            <code className="text-amber-100">users/{user.uid}</code> cambia{" "}
            <code className="text-amber-100">role</code> a{" "}
            <code className="text-amber-100">coach</code> y recarga la página.
          </p>
          <p className="mt-3 text-xs text-zinc-500">
            O pulsa abajo para recrear el perfil (solo si el documento no existe
            o quieres resetear).
          </p>
          <CoachProfileSetup user={user} onReady={() => {}} />
        </div>
      </div>
    );
  }

  if (!isCoachRole) {
    return (
      <div className="space-y-4">
        <p className="text-zinc-400">
          Esta zona es solo para el coach. Tu rol actual: {profile.role}.
        </p>
        <Link href="/perfil" className="text-sky-400 hover:underline">
          Ir a mi perfil
        </Link>
      </div>
    );
  }

  return (
    <CoachHubShell coachId={user.uid} displayName={profile.displayName} />
  );
}
