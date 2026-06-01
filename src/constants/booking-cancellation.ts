/** Política de cancelación y condiciones en pista (reservas de clase). */
export const BOOKING_CANCELLATION_POLICY_TITLE =
  "Cancelaciones y condiciones en pista";

export const BOOKING_CANCELLATION_POLICY_ITEMS = [
  {
    id: "station-closure",
    label: "Cierre de estación",
    text: "Si la estación cierra y no puede impartirse la clase, se devuelve el importe íntegro abonado (señal o pago total).",
  },
  {
    id: "opening-delay",
    label: "Retraso en la apertura",
    text: "Si la estación abre con retraso, se intentará reubicar la clase en otra franja horaria disponible ese mismo día o en fecha acordada contigo.",
  },
  {
    id: "late-no-show",
    label: "Retrasos y no presentación",
    text: "Si llegas tarde o no te presentas a la clase confirmada, no procede devolución del importe ni recuperación del tiempo no disfrutado.",
  },
] as const;

export const BOOKING_CANCELLATION_POLICY_NOTE =
  "La cancelación voluntaria por parte del alumno fuera de estos supuestos se gestiona caso a caso con el coach. Lo anterior no limita tus derechos como consumidor cuando la ley lo exija.";
