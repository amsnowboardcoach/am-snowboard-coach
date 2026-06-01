import Link from "next/link";
import { cn } from "@/lib/utils/cn";

interface SiteHeaderLogoProps {
  className?: string;
  onClick?: () => void;
}

export function SiteHeaderLogo({ className, onClick }: SiteHeaderLogoProps = {}) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn(
        "touch-manipulation text-lg font-bold tracking-tight transition hover:opacity-90 select-none",
        className,
      )}
      aria-label="AM Snowboard Coach — inicio"
    >
      AM <span className="brand-text">Snowboard</span>
      <span className="hidden font-normal text-zinc-500 sm:inline"> Coach</span>
    </Link>
  );
}
