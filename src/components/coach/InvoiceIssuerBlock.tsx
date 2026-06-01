import { formatIssuerAddress } from "@/lib/firebase/system-config";
import type { IssuerConfig } from "@/types/issuer";

export function InvoiceIssuerBlock({ issuer }: { issuer: IssuerConfig }) {
  return (
    <div className="rounded-lg border border-zinc-700/80 bg-zinc-900/60 p-3 text-xs text-zinc-300">
      <p className="font-medium uppercase tracking-wide text-zinc-500">
        Emisor
      </p>
      <p className="mt-1 text-zinc-200">{issuer.legalName}</p>
      <p className="text-zinc-500">NIF {issuer.taxId}</p>
      <p className="text-zinc-500">{formatIssuerAddress(issuer)}</p>
      {issuer.phone && <p className="text-zinc-500">{issuer.phone}</p>}
      {issuer.email && <p className="text-zinc-500">{issuer.email}</p>}
    </div>
  );
}
