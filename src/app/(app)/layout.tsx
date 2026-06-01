"use client";

import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/contexts/AuthProvider";
import { isFirebaseConfigured } from "@/lib/auth/config";
import { PageWayfinding } from "@/components/layout/PageWayfinding";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (!isFirebaseConfigured()) {
    return (
      <div className="site-mesh mx-auto max-w-lg px-4 py-24 text-center text-zinc-400">
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
        className="mx-auto w-full max-w-6xl flex-1 overflow-x-hidden px-4 py-6 pb-24 sm:py-8 sm:pb-8"
      >
        {children}
        <PageWayfinding />
      </main>
      <SiteFooter />
      <SiteChrome />
    </div>
  );
}
