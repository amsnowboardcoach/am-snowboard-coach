"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useClientHydrated } from "@/hooks/use-client-hydrated";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { SiteHeaderLogo } from "@/components/layout/SiteHeaderLogo";
import { MobileNavDrawer, type MobileNavLink } from "@/components/layout/MobileNavDrawer";
import { isCoachProfile } from "@/lib/auth/coach-role";
import { useSignOut } from "@/hooks/use-sign-out";
import {
  SITE_HEADER_CTA,
  SITE_HEADER_LINKS,
  SITE_NAV_AUTH,
} from "@/constants/site-navigation";
import { useAuth } from "@/contexts/AuthProvider";
import { cn } from "@/lib/utils/cn";

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  const { user, profile, loading } = useAuth();
  const hydrated = useClientHydrated();
  const signOut = useSignOut();
  const authReady = hydrated && !loading;
  const isCoach = profile ? isCoachProfile(profile) : false;
  const privateHref = isCoach ? "/coach" : "/perfil";
  const privateLabel = isCoach ? "Panel coach" : "Mi perfil";

  const mobileNavLinks: MobileNavLink[] = useMemo(() => {
    const base: MobileNavLink[] = SITE_HEADER_LINKS.map((item) => ({
      href: item.href,
      label: item.label,
    }));

    if (authReady && user) {
      base.push(
        { href: privateHref, label: privateLabel },
        { href: SITE_HEADER_CTA.href, label: SITE_HEADER_CTA.label, primary: true },
        { href: "#", label: "Cerrar sesión", onClick: signOut, variant: "danger" },
      );
      return base;
    }

    return [
      ...base,
      ...SITE_NAV_AUTH.map((item) => ({
        href: item.href,
        label: item.label,
      })),
      {
        href: SITE_HEADER_CTA.href,
        label: SITE_HEADER_CTA.label,
        primary: true,
      },
    ];
  }, [user, privateHref, privateLabel, signOut]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 overflow-visible border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]",
        className,
      )}
    >
      <div className="page-container flex items-center justify-between gap-3 py-3.5 sm:py-4">
        <SiteHeaderLogo />
        <nav
          className="hidden items-center gap-x-5 text-sm text-zinc-300 lg:flex"
          aria-label="Navegación principal"
        >
          {SITE_HEADER_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors duration-200 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          {authReady && user ? (
            <>
              <Link
                href={privateHref}
                className="transition-colors duration-200 hover:text-white"
              >
                {privateLabel}
              </Link>
              <Link
                href={SITE_HEADER_CTA.href}
                className="btn-primary-md"
              >
                {SITE_HEADER_CTA.label}
              </Link>
              <SignOutButton className="px-1 text-zinc-400" />
            </>
          ) : (
            <>
              {SITE_NAV_AUTH.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-colors duration-200 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={SITE_HEADER_CTA.href}
                className="btn-primary-md"
              >
                {SITE_HEADER_CTA.label}
              </Link>
            </>
          )}
        </nav>
        <MobileNavDrawer links={mobileNavLinks} />
      </div>
    </header>
  );
}
