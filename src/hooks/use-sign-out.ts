"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthProvider";

export function useSignOut() {
  const { signOut } = useAuth();
  const router = useRouter();

  return useCallback(() => {
    void signOut().then(() => router.push("/"));
  }, [signOut, router]);
}
