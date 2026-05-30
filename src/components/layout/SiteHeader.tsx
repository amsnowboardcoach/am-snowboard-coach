import Link from "next/link";
import { SiteHeaderLogo } from "@/components/layout/SiteHeaderLogo";
import { MobileNavDrawer, type MobileNavLink } from "@/components/layout/MobileNavDrawer";
import {
  SITE_HEADER_CTA,
  SITE_HEADER_LINKS,
  SITE_NAV_AUTH,
} from "@/constants/site-navigation";
import { cn } from "@/lib/utils/cn";

const mobileNavLinks: MobileNavLink[] = [
  ...SITE_HEADER_LINKS.map((item) => ({
    href: item.href,
    label: item.label,
  })),
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

interface SiteHeaderProps {
  className?: string;
}

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 overflow-visible border-b border-zinc-800/80 bg-zinc-950/95 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]",
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
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
            className="rounded-full bg-sky-500 px-4 py-2.5 font-semibold text-zinc-950 shadow-lg shadow-sky-500/20 transition duration-200 hover:bg-sky-400 active:scale-[0.98]"
          >
            {SITE_HEADER_CTA.label}
          </Link>
        </nav>
        <MobileNavDrawer links={mobileNavLinks} />
      </div>
    </header>
  );
}
