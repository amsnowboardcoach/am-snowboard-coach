"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { scrollToTop } from "@/lib/navigation/scroll";
import { COACH_ROLES } from "@/constants/roles";
import { useAuth } from "@/contexts/AuthProvider";
import { useSignOut } from "@/hooks/use-sign-out";
import { MobileNavDrawer, type MobileNavLink } from "@/components/layout/MobileNavDrawer";

export function AppHeader() {
  const { profile } = useAuth();
  const signOut = useSignOut();
  const isCoach = profile && COACH_ROLES.includes(profile.role);

  const homeHref = isCoach ? "/coach?tab=reservas" : "/perfil";

  const mobileLinks: MobileNavLink[] = isCoach
    ? [
        { href: "/coach?tab=reservas", label: "Panel coach" },
        { href: "/reservar", label: "Nueva reserva", primary: true },
        { href: "/tribu", label: "La Tribu" },
        { href: "/mercadillo", label: "Mercadillo" },
        { href: "/", label: "Web pública" },
        { href: "#", label: "Cerrar sesión", onClick: signOut, variant: "danger" },
      ]
    : [
        { href: "/perfil", label: "Perfil" },
        { href: "/perfil/avisos", label: "Avisos del coach" },
        { href: "/perfil/pasaporte", label: "Pasaporte de trucos" },
        { href: "/perfil/videos", label: "Mis vídeos" },
        { href: "/perfil/tribu", label: "Subir a La Tribu" },
        { href: "/tribu", label: "Ver La Tribu" },
        { href: "/mercadillo", label: "Mercadillo" },
        { href: "/reservar", label: "Reservar clase", primary: true },
        { href: "/", label: "Web pública" },
        { href: "#", label: "Cerrar sesión", onClick: signOut, variant: "danger" },
      ];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
      <div className="page-container flex items-center justify-between gap-3 py-3.5 sm:py-4">
        <Link
          href={homeHref}
          className="flex min-h-11 shrink-0 items-center py-1 font-bold leading-none"
        >
          AM <span className="brand-text">Snowboard</span>
        </Link>

        <nav
          className="hidden items-center gap-x-4 text-sm text-zinc-400 lg:flex"
          aria-label="Área privada"
        >
          {!isCoach && (
            <>
              <Link
                href="/perfil"
                onClick={() => scrollToTop()}
                className="transition-colors duration-200 hover:text-white"
              >
                Perfil
              </Link>
              <Link
                href="/perfil/avisos"
                onClick={() => scrollToTop()}
                className="transition-colors duration-200 hover:text-white"
              >
                Avisos
              </Link>
              <Link
                href="/perfil/pasaporte"
                onClick={() => scrollToTop()}
                className="transition-colors duration-200 hover:text-white"
              >
                Pasaporte
              </Link>
              <Link
                href="/tribu"
                onClick={() => scrollToTop()}
                className="transition-colors duration-200 hover:text-white"
              >
                Tribu
              </Link>
            </>
          )}
          {isCoach && (
            <>
              <Link
                href="/coach?tab=reservas"
                onClick={() => scrollToTop()}
                className="transition-colors duration-200 hover:text-white"
              >
                Panel coach
              </Link>
              <Link
                href="/reservar"
                onClick={() => scrollToTop()}
                className="btn-accent-soft px-3 py-1.5"
              >
                + Reserva
              </Link>
            </>
          )}
          <Link
            href="/"
            onClick={() => scrollToTop()}
            className="transition-colors duration-200 hover:text-white"
          >
            Web
          </Link>
          <button
            type="button"
            onClick={signOut}
            className="min-h-11 px-1 text-zinc-500 hover:text-red-300"
          >
            Cerrar sesión
          </button>
        </nav>

        <MobileNavDrawer links={mobileLinks} />
      </div>
    </header>
  );
}
