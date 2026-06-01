"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { CoachHubShell } from "@/components/coach/CoachHubShell";
import { CoachProfileSetup } from "@/components/coach/CoachProfileSetup";
import { isCoachEmail } from "@/lib/auth/config";
import { roleDisplayLabel } from "@/constants/roles";
import { isCoachRole } from "@/lib/auth/paths";

export default function CoachDashboardPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const isCoachByEmail = user?.email ? isCoachEmail(user.email) : false;
  const isCoach = profile ? isCoachRole(profile.role) : false;

  useEffect(() => {
    if (loading || !user || !profile) return;
    if (!isCoach && !isCoachByEmail) {
      router.replace("/perfil");
    }
  }, [loading, user, profile, isCoach, isCoachByEmail, router]);

  if (loading) {
    return (
      <p className="text-center text-zinc-500" role="status">
        Cargando panel del coach…
      </p>
    );
  }

  if (!user) {
    return null;
  }

  if (!profile) {
    return (
      <div className="content-align-start stack-section w-full max-w-2xl">
        <h1 className="page-title mx-0 max-w-none text-left">Panel del Coach</h1>
        <CoachProfileSetup
          user={user}
          onReady={() => void refreshProfile()}
        />
      </div>
    );
  }

  if (!isCoach && isCoachByEmail) {
    return (
      <div className="content-align-start stack-section w-full max-w-2xl">
        <h1 className="page-title mx-0 max-w-none text-left">Panel del Coach</h1>
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6">
          <p className="text-sm text-amber-200">
            Tu email es de coach pero el perfil tiene rol{" "}
            <strong>{roleDisplayLabel(profile.role)}</strong>. Crea o actualiza el perfil:
          </p>
          <CoachProfileSetup
            user={user}
            onReady={() => void refreshProfile()}
          />
        </div>
      </div>
    );
  }

  if (!isCoach) {
    return (
      <div className="space-y-4">
        <p className="text-zinc-400">
          Esta zona es solo para el coach. Tu rol actual:{" "}
          {roleDisplayLabel(profile.role)}.
        </p>
        <Link href="/perfil" className="text-sky-400 hover:underline">
          Ir a mi perfil
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full text-left">
      <CoachHubShell coachId={user.uid} displayName={profile.displayName} />
    </div>
  );
}
