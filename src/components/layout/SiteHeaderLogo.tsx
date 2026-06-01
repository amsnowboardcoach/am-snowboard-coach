import Link from "next/link";

export function SiteHeaderLogo() {
  return (
    <Link
      href="/"
      className="touch-manipulation text-lg font-bold tracking-tight transition hover:opacity-90 select-none"
      aria-label="AM Snowboard Coach — inicio"
    >
      AM <span className="brand-text">Snowboard</span>
      <span className="hidden font-normal text-zinc-500 sm:inline"> Coach</span>
    </Link>
  );
}
