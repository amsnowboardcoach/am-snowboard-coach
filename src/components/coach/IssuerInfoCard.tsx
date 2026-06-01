"use client";

import { useEffect, useState } from "react";
import {
  ensureIssuerConfig,
  formatIssuerAddress,
  getIssuerConfig,
} from "@/lib/firebase/system-config";
import type { IssuerConfig } from "@/types/issuer";

export function IssuerInfoCard() {
  const [issuer, setIssuer] = useState<IssuerConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await ensureIssuerConfig();
        const data = await getIssuerConfig();
        if (active) setIssuer(data);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-sm text-zinc-500">Cargando datos del emisor…</p>
    );
  }

  if (!issuer) return null;

  return (
    <div className="surface-elevated p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Emisor (tus datos fiscales)
      </h2>
      <p className="mt-3 font-medium text-zinc-100">{issuer.legalName}</p>
      <p className="text-sm text-sky-400">NIF {issuer.taxId}</p>
      <p className="mt-2 text-sm text-zinc-500">{formatIssuerAddress(issuer)}</p>
      {issuer.phone && (
        <p className="mt-1 text-sm text-zinc-500">{issuer.phone}</p>
      )}
      {issuer.email && (
        <p className="text-sm text-zinc-500">{issuer.email}</p>
      )}
      {issuer.activityDescription && (
        <p className="mt-2 text-xs text-zinc-500">{issuer.activityDescription}</p>
      )}
      <p className="mt-3 text-xs text-zinc-500">
        Aparecerán en el registro de cada factura. Para cambiarlos, edita{" "}
        <code className="text-zinc-500">system_config/issuer</code> en Firebase
        Console.
      </p>
    </div>
  );
}
