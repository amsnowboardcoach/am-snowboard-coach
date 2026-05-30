"use client";

import { usePathname } from "next/navigation";
import { getPageWayfinding } from "@/constants/site-navigation";
import { SiteLink } from "@/components/layout/SiteLink";

export function PageWayfinding() {
  const pathname = usePathname() ?? "/";
  const block = getPageWayfinding(pathname);

  if (!block) return null;

  return (
    <aside
      className="border-t border-zinc-800/80 bg-zinc-900/20"
      aria-label="Sigue navegando"
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400/90">
          {block.title}
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {block.links.map((link) => (
            <li key={link.href}>
              <SiteLink
                href={link.href}
                className="group flex min-h-[4.5rem] flex-col justify-center rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 transition duration-200 hover:border-sky-500/40 hover:bg-sky-500/5 active:scale-[0.99]"
              >
                <span className="font-medium text-zinc-100 group-hover:text-sky-300">
                  {link.label}
                  <span className="ml-1 text-zinc-600 transition group-hover:text-sky-400/80">
                    →
                  </span>
                </span>
                {link.description && (
                  <span className="mt-1 text-xs text-zinc-500">
                    {link.description}
                  </span>
                )}
              </SiteLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
