"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { getCoachWhatsAppUrl } from "@/constants/coach-contact";
import { LEGAL_PATHS } from "@/constants/legal-site";
import { COACH_ROLES } from "@/constants/roles";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { STUDENT_AREA_PATH } from "@/constants/student-area";
import { useClientHydrated } from "@/hooks/use-client-hydrated";

const GUEST_ACCOUNT_LINKS = [
  { href: STUDENT_AREA_PATH, label: "Área de alumno" },
  { href: "/reservar", label: "Reservar" },
] as const;

export function SiteFooter() {
  const { user, profile, loading } = useAuth();
  const hydrated = useClientHydrated();
  const isCoach = profile && COACH_ROLES.includes(profile.role);
  const authReady = hydrated && !loading;

  const accountLinks = useMemo(() => {
    if (!authReady) {
      return [...GUEST_ACCOUNT_LINKS];
    }
    if (!user) {
      return [...GUEST_ACCOUNT_LINKS];
    }
    if (isCoach) {
      return [...GUEST_ACCOUNT_LINKS];
    }
    return [
      { href: "/perfil", label: "Mi perfil" },
      { href: "/perfil/pasaporte", label: "Pasaporte de trucos" },
      { href: "/perfil/videos", label: "Mis vídeos" },
      { href: "/tribu", label: "La Tribu" },
      { href: "/mercadillo", label: "Mercadillo" },
    ];
  }, [authReady, user, isCoach]);

  const accountHeading = authReady && user ? "Tu cuenta" : "Alumnos";

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 sm:gap-10 lg:py-12">
        <div>
          <Link
            href="/"
            className="inline-block text-lg font-bold transition-colors duration-200 hover:text-zinc-200"
          >
            AM <span className="text-sky-400">Snowboard</span> Coach
          </Link>
          <p className="mt-3 max-w-sm text-sm text-zinc-400">
            Clases de snowboard en Sierra Nevada (Granada). Técnica, seguridad
            y seguimiento con Alejandro Martín, Head Coach AM.
          </p>
          <Link
            href="/reservar"
            className="mt-4 inline-flex rounded-full bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-300 transition duration-200 hover:bg-sky-500/25"
          >
            Reservar clase →
          </Link>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {accountHeading}
          </p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            {accountLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-block min-h-8 py-0.5 transition-colors duration-200 hover:text-sky-400"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            {authReady && user && !isCoach && (
              <li>
                <a
                  href={getCoachWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block min-h-8 py-0.5 text-emerald-400/90 transition-colors duration-200 hover:text-emerald-300"
                >
                  WhatsApp con Alejandro
                </a>
              </li>
            )}
            {authReady && user && (
              <li>
                <SignOutButton className="inline-block min-h-8 py-0.5 text-zinc-400 hover:text-red-300" />
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-800 px-4 py-6">
        <nav
          className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-zinc-500"
          aria-label="Información legal"
        >
          <Link
            href={LEGAL_PATHS.terms}
            className="transition-colors duration-200 hover:text-sky-400"
          >
            Términos de uso
          </Link>
          <Link
            href={LEGAL_PATHS.privacy}
            className="transition-colors duration-200 hover:text-sky-400"
          >
            Privacidad
          </Link>
          <Link
            href={LEGAL_PATHS.cookies}
            className="transition-colors duration-200 hover:text-sky-400"
          >
            Cookies
          </Link>
        </nav>
        <p
          className="mt-4 text-center text-xs text-zinc-600"
          suppressHydrationWarning
        >
          © {new Date().getFullYear()} AM Snowboard Coach · Sierra Nevada
        </p>
      </div>
    </footer>
  );
}
