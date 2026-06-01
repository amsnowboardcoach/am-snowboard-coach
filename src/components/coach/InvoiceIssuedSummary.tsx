import { formatFirestoreDate } from "@/lib/utils/dates";
import { centsToEuros } from "@/lib/utils/money";
import type { Booking } from "@/types/firestore";

const docTypeLabels = {
  simplified: "Simplificada",
  full: "Completa",
};

const recipientLabels = {
  individual: "Particular",
  business: "Profesional / Empresa",
};

export function InvoiceIssuedSummary({ booking }: { booking: Booking }) {
  const inv = booking.invoice;
  const tax = inv.tax;
  const recipient = inv.recipient;

  return (
    <div className="mt-3 space-y-2 rounded-lg bg-zinc-100 p-3 text-xs text-zinc-600">
      {(inv.issuerLegalName || inv.issuerTaxId) && (
        <p>
          <span className="text-zinc-500">Emisor:</span> {inv.issuerLegalName}{" "}
          {inv.issuerTaxId ? `· NIF ${inv.issuerTaxId}` : ""}
        </p>
      )}
      <p>
        <span className="text-zinc-500">Tipo:</span>{" "}
        {inv.documentType ? docTypeLabels[inv.documentType] : "—"}
        {recipient?.type && (
          <>
            {" · "}
            <span className="text-zinc-500">Cliente:</span>{" "}
            {recipientLabels[recipient.type]}
          </>
        )}
      </p>
      {inv.concept && (
        <p>
          <span className="text-zinc-500">Concepto:</span> {inv.concept}
        </p>
      )}
      {recipient && (
        <p>
          <span className="text-zinc-500">Receptor:</span> {recipient.legalName}
          {recipient.taxId ? ` · ${recipient.taxId}` : ""}
        </p>
      )}
      {recipient?.address && (
        <p>
          {recipient.address}, {recipient.postalCode} {recipient.city}
          {recipient.province ? ` (${recipient.province})` : ""}
        </p>
      )}
      {tax && (
        <p className="text-zinc-700">
          Base {centsToEuros(tax.baseAmountCents)} + IVA {tax.vatRatePercent}% (
          {centsToEuros(tax.vatAmountCents)}) ={" "}
          <strong className="text-zinc-900">
            {centsToEuros(tax.totalAmountCents)}
          </strong>
        </p>
      )}
      <p className="text-zinc-500">
        Emitida: {formatFirestoreDate(inv.issuedAt, "d MMM yyyy")}
        {inv.pdfUrl && (
          <>
            {" · "}
            <a
              href={inv.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:underline"
            >
              PDF
            </a>
          </>
        )}
      </p>
    </div>
  );
}
