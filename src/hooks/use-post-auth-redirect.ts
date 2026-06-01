"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { resolvePostLoginPath } from "@/lib/auth/paths";

/** En /login o /registro: si ya hay sesión, ir al panel correspondiente. */
export function usePostAuthRedirect(enabled = true): void {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (!enabled || loading || !user || !profile || redirectedRef.current) {
      return;
    }
    if (!pathname.startsWith("/login") && !pathname.startsWith("/registro")) {
      return;
    }
    redirectedRef.current = true;
    const next = searchParams.get("next");
    router.replace(resolvePostLoginPath(profile.role, next));
  }, [enabled, loading, user, profile, pathname, searchParams, router]);
}
