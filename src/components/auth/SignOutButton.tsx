"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { useSignOut } from "@/hooks/use-sign-out";
import { cn } from "@/lib/utils/cn";

interface SignOutButtonProps {
  className?: string;
  children?: ReactNode;
}

export function SignOutButton({
  className,
  children = "Cerrar sesión",
}: SignOutButtonProps) {
  const { user, loading } = useAuth();
  const signOut = useSignOut();

  if (loading || !user) return null;

  return (
    <button
      type="button"
      onClick={signOut}
      className={cn(
        "min-h-11 text-left transition-colors duration-200 hover:text-red-300",
        className,
      )}
    >
      {children}
    </button>
  );
}
