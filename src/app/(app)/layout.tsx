"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/contexts/AuthProvider";
import { isFirebaseConfigured } from "@/lib/auth/config";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { cn } from "@/lib/utils/cn";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname() ?? "";
  const isCoachHub =
    pathname === "/coach" || pathname.startsWith("/coach/");

  if (!isFirebaseConfigured()) {
    return (
      <div className="page-container max-w-lg py-24 text-center text-zinc-400">
        Configura Firebase en <code className="text-sky-400">.env.local</code>{" "}
        para acceder al área privada.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="site-mesh flex min-h-screen items-center justify-center text-zinc-500">
        Cargando tu sesión…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="site-mesh flex min-h-screen items-center justify-center text-zinc-500">
        Redirigiendo al acceso…
      </div>
    );
  }

  return (
    <div className="site-mesh flex min-h-dvh flex-col">
      <AppHeader />
      <main
        id="main-content"
        className={cn(
          "page-container max-w-6xl flex-1 overflow-x-hidden py-6 sm:py-10 lg:py-12",
          isCoachHub && "py-4 sm:py-10",
        )}
      >
        {children}
      </main>
      <SiteFooter />
      <SiteChrome />
    </div>
  );
}
