"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  updateBookingInvoice,
  uploadInvoicePdf,
} from "@/lib/firebase/bookings";
import {
  INVOICE_CONCEPT_DEFAULT,
  INVOICE_DOCUMENT_TYPES,
  RECIPIENT_TYPES,
  VAT_RATES,
  type InvoiceDocumentType,
  type RecipientType,
  type VatRateId,
} from "@/constants/invoicing";
import {
  calculateFromBase,
  calculateFromTotal,
  suggestDocumentType,
} from "@/lib/invoicing/calculate";
import { validateInvoiceForm } from "@/lib/invoicing/validate";
import { centsToEuros, parseEurosInput } from "@/lib/utils/money";
import { getIssuerConfig } from "@/lib/firebase/system-config";
import type { Booking, InvoiceStatus } from "@/types/firestore";
import type { IssuerConfig } from "@/types/issuer";
import { InvoiceIssuerBlock } from "./InvoiceIssuerBlock";
import { InvoiceIssuedSummary } from "./InvoiceIssuedSummary";

interface BookingInvoiceFormProps {
  booking: Booking;
  coachId: string;
  onUpdated: () => void;
}

const inputClass =
  "form-input mt-1";

export function BookingInvoiceForm({
  booking,
  coachId,
  onUpdated,
}: BookingInvoiceFormProps) {
  const existing = booking.invoice;
  const paymentTotal = booking.payment.amountCents;

  const [expanded, setExpanded] = useState(
    booking.payment.status === "paid" && booking.invoice.status === "pending",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState(existing.number ?? "");
  const [issuedDate, setIssuedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [concept, setConcept] = useState(
    existing.concept ??
      `${INVOICE_CONCEPT_DEFAULT} — ${booking.lessonTypeName}`,
  );

  const [recipientType, setRecipientType] = useState<RecipientType>(
    existing.recipient?.type ?? "individual",
  );
  const [documentType, setDocumentType] = useState<InvoiceDocumentType>(
    existing.documentType ?? "simplified",
  );
  const [legalName, setLegalName] = useState(
    existing.recipient?.legalName ?? booking.studentDisplayName ?? "",
  );
  const [taxId, setTaxId] = useState(existing.recipient?.taxId ?? "");
  const [address, setAddress] = useState(existing.recipient?.address ?? "");
  const [postalCode, setPostalCode] = useState(
    existing.recipient?.postalCode ?? "",
  );
  const [city, setCity] = useState(existing.recipient?.city ?? "");
  const [province, setProvince] = useState(existing.recipient?.province ?? "");
  const [country, setCountry] = useState(existing.recipient?.country ?? "ES");
  const [recipientEmail, setRecipientEmail] = useState(
    existing.recipient?.email ?? booking.studentEmail ?? "",
  );

  const [vatRate, setVatRate] = useState<VatRateId>(
    (existing.tax?.vatRatePercent as VatRateId) ?? 21,
  );
  const [priceIncludesVat, setPriceIncludesVat] = useState(
    existing.tax?.priceIncludesVat ?? true,
  );
  const [amountInput, setAmountInput] = useState(() => {
    const cents =
      (existing.tax?.priceIncludesVat ?? true)
        ? (existing.tax?.totalAmountCents ?? paymentTotal)
        : (existing.tax?.baseAmountCents ?? paymentTotal);
    return (cents / 100).toFixed(2);
  });
  const [vatExemptionReason, setVatExemptionReason] = useState(
    existing.tax?.vatExemptionReason ?? "",
  );
  const [notes, setNotes] = useState(existing.notes ?? "");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [issuer, setIssuer] = useState<IssuerConfig | null>(null);

  useEffect(() => {
    getIssuerConfig().then(setIssuer);
  }, []);

  const amounts = useMemo(() => {
    const cents = Math.round(parseEurosInput(amountInput) * 100);
    if (priceIncludesVat) {
      return calculateFromTotal(cents, vatRate);
    }
    return calculateFromBase(cents, vatRate);
  }, [amountInput, priceIncludesVat, vatRate]);

  const suggestedDocType = useMemo(
    () => suggestDocumentType(recipientType, amounts.totalAmountCents),
    [recipientType, amounts.totalAmountCents],
  );

  const isProfessional = recipientType === "business";
  const requiresFullInvoice = documentType === "full" || isProfessional;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validateInvoiceForm({
      documentType,
      recipientType,
      legalName,
      taxId,
      address,
      postalCode,
      city,
      totalAmountCents: amounts.totalAmountCents,
      vatExemptionReason,
      vatRatePercent: vatRate,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      let pdfUrl = existing.pdfUrl;
      let pdfStoragePath = existing.pdfStoragePath;

      if (pdfFile) {
        const uploaded = await uploadInvoicePdf(booking.id, pdfFile);
        pdfUrl = uploaded.pdfUrl;
        pdfStoragePath = uploaded.pdfStoragePath;
      }

      if (!issuer) {
        setError("No se pudieron cargar los datos del emisor.");
        return;
      }

      await updateBookingInvoice(booking.id, coachId, {
        status: "issued",
        number: invoiceNumber.trim(),
        issuedAt: new Date(issuedDate),
        documentType,
        concept: concept.trim(),
        issuer: {
          legalName: issuer.legalName,
          taxId: issuer.taxId,
        },
        recipient: {
          type: recipientType,
          legalName: legalName.trim(),
          taxId: taxId.trim() || undefined,
          address: address.trim() || undefined,
          postalCode: postalCode.trim() || undefined,
          city: city.trim() || undefined,
          province: province.trim() || undefined,
          country: country.trim() || "ES",
          email: recipientEmail.trim() || undefined,
        },
        tax: {
          vatRatePercent: vatRate,
          baseAmountCents: amounts.baseAmountCents,
          vatAmountCents: amounts.vatAmountCents,
          totalAmountCents: amounts.totalAmountCents,
          priceIncludesVat,
          ...(vatRate === 0 && vatExemptionReason.trim()
            ? { vatExemptionReason: vatExemptionReason.trim() }
            : {}),
        },
        notes: notes.trim() || undefined,
        pdfUrl,
        pdfStoragePath,
      });

      setExpanded(false);
      onUpdated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al guardar factura",
      );
    } finally {
      setLoading(false);
    }
  }

  async function markNotRequired() {
    setLoading(true);
    try {
      await updateBookingInvoice(booking.id, coachId, {
        status: "not_required",
      });
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  const statusLabel: Record<InvoiceStatus, string> = {
    pending: "Factura pendiente",
    issued: "Factura emitida",
    not_required: "Sin factura",
  };

  const statusColor: Record<InvoiceStatus, string> = {
    pending: "bg-amber-500/20 text-amber-300",
    issued: "bg-emerald-500/20 text-emerald-300",
    not_required: "bg-zinc-700 text-zinc-500",
  };

  return (
    <div className="mt-4 border-t border-zinc-800/80 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[booking.invoice.status]}`}
        >
          {statusLabel[booking.invoice.status]}
          {booking.invoice.number ? ` · ${booking.invoice.number}` : ""}
        </span>
        {booking.payment.status === "paid" &&
          booking.invoice.status !== "issued" && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-sm link-accent underline-offset-2 hover:underline"
            >
              {expanded ? "Ocultar" : "Registrar factura"}
            </button>
          )}
      </div>

      {booking.invoice.status === "issued" && (
        <InvoiceIssuedSummary booking={booking} />
      )}

      {expanded && booking.invoice.status !== "issued" && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <p className="text-xs text-zinc-500">
            Datos para factura conforme al RD 1619/2012. Tú emites el documento
            legal fuera de la app; aquí registras la información fiscal.
          </p>

          {issuer && <InvoiceIssuerBlock issuer={issuer} />}

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-zinc-200">
              Identificación de la factura
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-zinc-300">
                Nº factura (serie correlativa) *
                <input
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="2026-0042"
                  className={inputClass}
                />
              </label>
              <label className="block text-sm text-zinc-300">
                Fecha de expedición *
                <input
                  type="date"
                  required
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <label className="block text-sm text-zinc-300">
              Concepto / descripción del servicio *
              <input
                required
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className={inputClass}
              />
            </label>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-zinc-200">
              Cliente (receptor)
            </legend>
            <div className="flex flex-wrap gap-2">
              {RECIPIENT_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setRecipientType(t.id);
                    if (t.id === "business") setDocumentType("full");
                  }}
                  className={`rounded-full px-4 py-2 text-sm ${
                    recipientType === t.id
                      ? "chip-toggle-active"
                      : "chip-toggle-inactive"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <label className="block text-sm text-zinc-300">
              Tipo de factura *
              <select
                value={documentType}
                onChange={(e) =>
                  setDocumentType(e.target.value as InvoiceDocumentType)
                }
                className={inputClass}
              >
                {INVOICE_DOCUMENT_TYPES.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-zinc-500">
                Recomendado:{" "}
                {INVOICE_DOCUMENT_TYPES.find((d) => d.id === suggestedDocType)
                  ?.label}
                .{" "}
                {
                  INVOICE_DOCUMENT_TYPES.find((d) => d.id === suggestedDocType)
                    ?.hint
                }
              </span>
            </label>

            <label className="block text-sm text-zinc-300">
              Nombre o razón social *
              <input
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block text-sm text-zinc-300">
              NIF / CIF / NIE {requiresFullInvoice ? "*" : "(opcional en simplificada)"}
              <input
                required={requiresFullInvoice}
                value={taxId}
                onChange={(e) => setTaxId(e.target.value.toUpperCase())}
                placeholder="12345678Z / B12345678"
                className={inputClass}
              />
            </label>

            {requiresFullInvoice && (
              <>
                <label className="block text-sm text-zinc-300">
                  Dirección fiscal *
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle, número"
                    className={inputClass}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block text-sm text-zinc-300">
                    C.P. *
                    <input
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm text-zinc-300">
                    Ciudad *
                    <input
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <label className="block text-sm text-zinc-300">
                    Provincia
                    <input
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                </div>
              </>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm text-zinc-300">
                País
                <input
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block text-sm text-zinc-300">
                Email cliente
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-zinc-200">
              IVA (LIVA — España)
            </legend>
            <label className="block text-sm text-zinc-300">
              Tipo de IVA aplicado *
              <select
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value) as VatRateId)}
                className={inputClass}
              >
                {VAT_RATES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>

            {vatRate === 0 && (
              <label className="block text-sm text-zinc-300">
                Motivo de exención *
                <input
                  required
                  value={vatExemptionReason}
                  onChange={(e) => setVatExemptionReason(e.target.value)}
                  placeholder="Ej. art. 20.1 LIVA — servicios exentos"
                  className={inputClass}
                />
              </label>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPriceIncludesVat(true)}
                className={`rounded-full px-4 py-2 text-sm ${
                  priceIncludesVat
                    ? "bg-zinc-700 text-white"
                    : "border border-zinc-600/90 text-zinc-500"
                }`}
              >
                Importe con IVA incluido
              </button>
              <button
                type="button"
                onClick={() => setPriceIncludesVat(false)}
                className={`rounded-full px-4 py-2 text-sm ${
                  !priceIncludesVat
                    ? "bg-zinc-700 text-white"
                    : "border border-zinc-600/90 text-zinc-500"
                }`}
              >
                Base imponible (sin IVA)
              </button>
            </div>

            <label className="block text-sm text-zinc-300">
              {priceIncludesVat ? "Total con IVA (€) *" : "Base imponible (€) *"}
              <input
                required
                inputMode="decimal"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                className={inputClass}
              />
            </label>

            <div className="surface-elevated p-4 text-sm">
              <p className="text-zinc-500">Desglose calculado</p>
              <dl className="mt-2 grid gap-1 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-zinc-500">Base imponible</dt>
                  <dd className="font-medium text-zinc-200">
                    {centsToEuros(amounts.baseAmountCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">
                    Cuota IVA ({amounts.vatRatePercent}%)
                  </dt>
                  <dd className="font-medium text-zinc-200">
                    {centsToEuros(amounts.vatAmountCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Total factura</dt>
                  <dd className="font-semibold text-sky-400">
                    {centsToEuros(amounts.totalAmountCents)}
                  </dd>
                </div>
              </dl>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-zinc-200">
              Archivo y notas
            </legend>
            <label className="block text-sm text-zinc-300">
              PDF de la factura emitida (opcional)
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
                className="mt-1 w-full text-sm text-zinc-500"
              />
            </label>
            <label className="block text-sm text-zinc-300">
              Notas internas
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. enviada por email al cliente"
                className={inputClass}
              />
            </label>
          </fieldset>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-sm disabled:opacity-50"
            >
              {loading ? "Guardando…" : "Registrar factura emitida"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={markNotRequired}
              className="btn-outline btn-inline"
            >
              No requiere factura
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
