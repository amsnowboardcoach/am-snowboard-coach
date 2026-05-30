import {
  SIMPLIFIED_INVOICE_MAX_CENTS,
  type InvoiceDocumentType,
  type RecipientType,
} from "@/constants/invoicing";

export interface InvoiceAmounts {
  baseAmountCents: number;
  vatAmountCents: number;
  totalAmountCents: number;
  vatRatePercent: number;
}

export function calculateFromTotal(
  totalCents: number,
  vatRatePercent: number,
): InvoiceAmounts {
  if (vatRatePercent === 0) {
    return {
      baseAmountCents: totalCents,
      vatAmountCents: 0,
      totalAmountCents: totalCents,
      vatRatePercent: 0,
    };
  }
  const baseAmountCents = Math.round(
    totalCents / (1 + vatRatePercent / 100),
  );
  const vatAmountCents = totalCents - baseAmountCents;
  return {
    baseAmountCents,
    vatAmountCents,
    totalAmountCents: totalCents,
    vatRatePercent,
  };
}

export function calculateFromBase(
  baseCents: number,
  vatRatePercent: number,
): InvoiceAmounts {
  const vatAmountCents =
    vatRatePercent === 0 ? 0 : Math.round(baseCents * (vatRatePercent / 100));
  return {
    baseAmountCents: baseCents,
    vatAmountCents,
    totalAmountCents: baseCents + vatAmountCents,
    vatRatePercent,
  };
}

export function suggestDocumentType(
  recipientType: RecipientType,
  totalCents: number,
): InvoiceDocumentType {
  if (recipientType === "business") return "full";
  if (totalCents > SIMPLIFIED_INVOICE_MAX_CENTS) return "full";
  return "simplified";
}

/** Validación básica NIF/CIF/NIE español */
export function isValidSpanishTaxId(value: string): boolean {
  const id = value.trim().toUpperCase().replace(/[\s-]/g, "");
  if (!id) return false;
  const nif = /^[0-9]{8}[A-Z]$/;
  const nie = /^[XYZ][0-9]{7}[A-Z]$/;
  const cif = /^[ABCDEFGHJNPQRSUVW][0-9]{7}[0-9A-J]$/;
  return nif.test(id) || nie.test(id) || cif.test(id);
}
