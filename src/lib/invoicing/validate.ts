import {
  SIMPLIFIED_INVOICE_MAX_CENTS,
  type InvoiceDocumentType,
  type RecipientType,
} from "@/constants/invoicing";
import { isValidSpanishTaxId } from "@/lib/invoicing/calculate";

export interface InvoiceFormValidationInput {
  documentType: InvoiceDocumentType;
  recipientType: RecipientType;
  legalName: string;
  taxId: string;
  address: string;
  postalCode: string;
  city: string;
  totalAmountCents: number;
  vatExemptionReason?: string;
  vatRatePercent: number;
}

export function validateInvoiceForm(
  input: InvoiceFormValidationInput,
): string | null {
  if (!input.legalName.trim()) {
    return "Indica el nombre o razón social del cliente.";
  }

  if (input.documentType === "full" || input.recipientType === "business") {
    if (!input.taxId.trim()) {
      return "NIF/CIF del cliente obligatorio en factura completa o cliente profesional.";
    }
    if (!isValidSpanishTaxId(input.taxId)) {
      return "El NIF/CIF/NIE no tiene un formato válido.";
    }
    if (!input.address.trim() || !input.postalCode.trim() || !input.city.trim()) {
      return "Dirección fiscal completa obligatoria (calle, CP y ciudad).";
    }
  }

  if (
    input.documentType === "simplified" &&
    input.totalAmountCents > SIMPLIFIED_INVOICE_MAX_CENTS
  ) {
    return "Importe superior a 400 €: debes emitir factura completa.";
  }

  if (input.vatRatePercent === 0 && !input.vatExemptionReason?.trim()) {
    return "Indica el motivo de exención de IVA (art. 20 LIVA u otro).";
  }

  return null;
}
