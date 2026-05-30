/** Tipos de factura según RD 1619/2012 */
export const INVOICE_DOCUMENT_TYPES = [
  {
    id: "simplified",
    label: "Factura simplificada",
    hint: "Particular, importe ≤ 400 € (IVA incluido). Sin obligación de NIF del cliente.",
  },
  {
    id: "full",
    label: "Factura completa",
    hint: "Empresa/autónomo cliente o importe > 400 €. NIF/CIF y nombre fiscal obligatorios.",
  },
] as const;

export type InvoiceDocumentType =
  (typeof INVOICE_DOCUMENT_TYPES)[number]["id"];

export const RECIPIENT_TYPES = [
  {
    id: "individual",
    label: "Particular (consumidor final)",
  },
  {
    id: "business",
    label: "Profesional / Empresa",
  },
] as const;

export type RecipientType = (typeof RECIPIENT_TYPES)[number]["id"];

/** Tipos de IVA habituales en prestación de servicios (clases) */
export const VAT_RATES = [
  { id: 21, label: "21 % — tipo general" },
  { id: 10, label: "10 % — reducido" },
  { id: 4, label: "4 % — superreducido" },
  { id: 0, label: "0 % — exento" },
] as const;

export type VatRateId = (typeof VAT_RATES)[number]["id"];

/** Umbral factura simplificada (IVA incluido), RD 1619/2012 art. 4.2.d) */
export const SIMPLIFIED_INVOICE_MAX_CENTS = 40_000;

export const INVOICE_CONCEPT_DEFAULT =
  "Clase de snowboard — Sierra Nevada";
