export type CoachHubTab =
  | "reservas"
  | "facturacion"
  | "alumnos"
  | "tribu"
  | "mercadillo";

export const COACH_HUB_DEFAULT_TAB: CoachHubTab = "reservas";

export const COACH_HUB_TABS: {
  id: CoachHubTab;
  label: string;
  description: string;
}[] = [
  {
    id: "reservas",
    label: "Reservas",
    description: "Solicitudes, confirmar y crear reservas",
  },
  {
    id: "facturacion",
    label: "Facturación",
    description: "Datos fiscales y facturas pendientes",
  },
  {
    id: "alumnos",
    label: "Alumnos",
    description: "Vídeos, Pasaporte de Trucos y seguimiento",
  },
  {
    id: "tribu",
    label: "La Tribu",
    description: "Moderar fotos y vídeos de alumnos",
  },
  {
    id: "mercadillo",
    label: "Mercadillo",
    description: "Anuncios activos y moderación",
  },
];

export function isCoachHubTab(value: string | null): value is CoachHubTab {
  return COACH_HUB_TABS.some((t) => t.id === value);
}

export function coachHubHref(tab: CoachHubTab = COACH_HUB_DEFAULT_TAB): string {
  if (tab === COACH_HUB_DEFAULT_TAB) return "/coach";
  return `/coach?tab=${tab}`;
}
