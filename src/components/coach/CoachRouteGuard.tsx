"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { isCoachProfile } from "@/lib/auth/coach-role";
import { isCoachEmail } from "@/lib/auth/config";

/** Bloquea /coach* a quien no sea monitor (rol o email en NEXT_PUBLIC_COACH_EMAILS). */
export function CoachRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  const email = profile?.email ?? user?.email ?? "";
  const isCoach =
    (profile && isCoachProfile(profile)) ||
    Boolean(email && isCoachEmail(email));

  useEffect(() => {
    if (loading || !user) return;
    if (!isCoach) {
      router.replace("/perfil");
    }
  }, [loading, user, isCoach, router]);

  if (loading || !user) {
    return (
      <p className="text-center text-zinc-500" role="status">
        Cargando panel del coach…
      </p>
    );
  }

  if (!isCoach) {
    return null;
  }

  return <>{children}</>;
}
