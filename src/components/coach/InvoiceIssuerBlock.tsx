import { formatIssuerAddress } from "@/lib/firebase/system-config";
import type { IssuerConfig } from "@/types/issuer";

export function InvoiceIssuerBlock({ issuer }: { issuer: IssuerConfig }) {
  return (
    <div className="rounded-lg border border-zinc-300/80 bg-zinc-50/95 p-3 text-xs">
      <p className="font-medium uppercase tracking-wide text-zinc-500">
        Emisor
      </p>
      <p className="mt-1 text-zinc-800">{issuer.legalName}</p>
      <p className="text-zinc-600">NIF {issuer.taxId}</p>
      <p className="text-zinc-500">{formatIssuerAddress(issuer)}</p>
      {issuer.phone && <p className="text-zinc-500">{issuer.phone}</p>}
      {issuer.email && <p className="text-zinc-500">{issuer.email}</p>}
    </div>
  );
}
