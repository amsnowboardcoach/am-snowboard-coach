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
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-zinc-800/90 bg-zinc-900/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md sm:p-5"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 max-w-2xl">
          <p id="cookie-banner-title" className="font-semibold text-zinc-100">
            Cookies y privacidad
          </p>
          <p id="cookie-banner-desc" className="mt-1 text-sm leading-relaxed text-zinc-400">
            Usamos cookies y almacenamiento local necesarios para el inicio de
            sesión, reservas y seguridad. Puedes leer más en nuestra{" "}
            <Link href={LEGAL_PATHS.cookies} className="link-accent underline-offset-2 hover:underline">
              Política de cookies
            </Link>{" "}
            y{" "}
            <Link href={LEGAL_PATHS.privacy} className="link-accent underline-offset-2 hover:underline">
              Política de privacidad
            </Link>
            .
          </p>
        </div>
        <div className="flex w-full shrink-0 flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={() => save("necessary")}
            className="btn-outline btn-inline min-h-11"
          >
            Solo necesarias
          </button>
          <button
            type="button"
            onClick={() => save("accepted")}
            className="btn-primary-md btn-inline"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
