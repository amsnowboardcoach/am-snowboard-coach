/** Plantillas de aviso masivo del coach a alumnos seleccionados. */
export const COACH_BROADCAST_TEMPLATE_IDS = [
  "station_closed",
  "opening_delay",
  "weather_alert",
  "meeting_point_change",
  "custom",
] as const;

export type CoachBroadcastTemplateId =
  (typeof COACH_BROADCAST_TEMPLATE_IDS)[number];

export interface CoachBroadcastTemplate {
  id: Exclude<CoachBroadcastTemplateId, "custom">;
  label: string;
  title: string;
  body: string;
}

export const COACH_BROADCAST_TEMPLATES: CoachBroadcastTemplate[] = [
  {
    id: "station_closed",
    label: "Estación cerrada",
    title: "Sierra Nevada: estación cerrada",
    body: "Hoy la estación permanece cerrada. Si tenías clase reservada, te escribiré para reprogramar. Disculpa las molestias.",
  },
  {
    id: "opening_delay",
    label: "Retraso de apertura",
    title: "Retraso en la apertura",
    body: "La apertura de remontes se ha retrasado. Te aviso en cuanto confirme el nuevo horario. Mantente atento a los avisos.",
  },
  {
    id: "weather_alert",
    label: "Alerta meteorológica",
    title: "Aviso por condiciones en pista",
    body: "Las condiciones meteorológicas pueden afectar a la jornada. Revisa este aviso antes de subir; te confirmaré si la clase se mantiene.",
  },
  {
    id: "meeting_point_change",
    label: "Cambio de punto de encuentro",
    title: "Cambio de punto de encuentro",
    body: "Hoy nos vemos en otro punto de la estación. Revisa tu email o responde por WhatsApp si necesitas indicaciones.",
  },
];

export function findCoachBroadcastTemplate(
  id: string,
): CoachBroadcastTemplate | undefined {
  return COACH_BROADCAST_TEMPLATES.find((t) => t.id === id);
}
