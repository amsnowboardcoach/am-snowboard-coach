"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  COOKIE_CONSENT_KEY,
  LEGAL_PATHS,
} from "@/constants/legal-site";

type ConsentValue = "accepted" | "necessary";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function save(value: ConsentValue) {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, value);
    } catch {
      /* ignore */
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-zinc-300 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md sm:p-5"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p id="cookie-banner-title" className="font-semibold text-zinc-900">
            Cookies y privacidad
          </p>
          <p id="cookie-banner-desc" className="mt-1 text-sm leading-relaxed text-zinc-600">
            Usamos cookies y almacenamiento local necesarios para el inicio de
            sesión, reservas y seguridad. Puedes leer más en nuestra{" "}
            <Link href={LEGAL_PATHS.cookies} className="text-sky-400 hover:underline">
              Política de cookies
            </Link>{" "}
            y{" "}
            <Link href={LEGAL_PATHS.privacy} className="text-sky-400 hover:underline">
              Política de privacidad
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => save("necessary")}
            className="rounded-full border border-zinc-400 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:border-zinc-500"
          >
            Solo necesarias
          </button>
          <button
            type="button"
            onClick={() => save("accepted")}
            className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-sky-400"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
