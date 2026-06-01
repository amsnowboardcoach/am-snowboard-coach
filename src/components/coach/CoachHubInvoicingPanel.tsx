"use client";

import { IssuerInfoCard } from "@/components/coach/IssuerInfoCard";
import { CoachBookingsPanel } from "@/components/coach/CoachBookingsPanel";

interface CoachHubInvoicingPanelProps {
  coachId: string;
}

export function CoachHubInvoicingPanel({ coachId }: CoachHubInvoicingPanelProps) {
  return (
    <div className="space-y-8">
      <p className="text-sm text-zinc-600">
        Revisa los datos del emisor y emite facturas en las reservas ya pagadas.
      </p>
      <IssuerInfoCard />
      <div>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Reservas sin factura
        </h2>
        <CoachBookingsPanel
          coachId={coachId}
          initialFilter="pending_invoice"
          showCreateForm={false}
        />
      </div>
    </div>
  );
}
