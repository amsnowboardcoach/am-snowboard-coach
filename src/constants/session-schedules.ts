export type SessionDurationId = "2h" | "3h" | "full-day";

export interface SessionTimeSlot {
  id: string;
  /** Hora inicio en Europe/Madrid, formato 24h */
  start: string;
  end: string;
  /** Texto para la web, ej. "10:00 – 12:00" */
  label: string;
}

export interface SessionDuration {
  id: SessionDurationId;
  name: string;
  shortLabel: string;
  description: string;
  durationMinutes: number;
  /** Horas facturadas (día completo = 6 h en pista 10:00–16:00) */
  billableHours: number;
  /** Precio por hora en € */
  pricePerHourEuros: number;
  /** Identificador legado (antes Cal.com); no usado en reservas web */
  calSlug: string;
  slots: SessionTimeSlot[];
}

function slot(id: string, start: string, end: string): SessionTimeSlot {
  return { id, start, end, label: `${start} – ${end}` };
}

/** Turnos fijos en pista (Sierra Nevada, horario diurno) */
export const SESSION_DURATIONS: SessionDuration[] = [
  {
    id: "2h",
    name: "Clase 2 horas",
    shortLabel: "2 h",
    description:
      "Dos horas de pista para avanzar con foco. Elige turno de mañana o tarde.",
    durationMinutes: 120,
    billableHours: 2,
    pricePerHourEuros: 55,
    calSlug: "curso-de-2-horas",
    slots: [
      slot("10-12", "10:00", "12:00"),
      slot("12-14", "12:00", "14:00"),
      slot("14-16", "14:00", "16:00"),
    ],
  },
  {
    id: "3h",
    name: "Clase 3 horas",
    shortLabel: "3 h",
    description:
      "Tres horas seguidas para trabajar técnica sin prisas y consolidar lo aprendido.",
    durationMinutes: 180,
    billableHours: 3,
    pricePerHourEuros: 50,
    calSlug: "curso-de-3-horas",
    slots: [
      slot("10-13", "10:00", "13:00"),
      slot("13-16", "13:00", "16:00"),
    ],
  },
  {
    id: "full-day",
    name: "Día completo en pista",
    shortLabel: "Día completo",
    description:
      "Jornada completa de 10:00 a 16:00: seis horas en pista con pausa para comer.",
    durationMinutes: 360,
    billableHours: 6,
    pricePerHourEuros: 35,
    calSlug: "full-day",
    slots: [slot("10-16", "10:00", "16:00")],
  },
];

export function getSessionDuration(
  id: SessionDurationId,
): SessionDuration | undefined {
  return SESSION_DURATIONS.find((s) => s.id === id);
}

export function getSessionByCalSlug(slug: string): SessionDuration | undefined {
  return SESSION_DURATIONS.find((s) => s.calSlug === slug);
}

export const DEFAULT_SESSION_DURATION_ID: SessionDurationId = "2h";

/** Suplemento por cada persona adicional (la primera va incluida en el precio base) */
export const EXTRA_PERSON_SUPPLEMENT_EUROS: Record<SessionDurationId, number> = {
  "2h": 10,
  "3h": 10,
  "full-day": 50,
};

/** Máximo de personas en pista por modalidad */
export const MAX_PARTICIPANTS: Record<SessionDurationId, number> = {
  "2h": 4,
  "3h": 6,
  "full-day": 8,
};

export function getMaxParticipants(durationId: SessionDurationId): number {
  return MAX_PARTICIPANTS[durationId];
}

export function extraParticipantCount(participantCount: number): number {
  return Math.max(0, participantCount - 1);
}

/** Importe total de la sesión en € (1 persona = precio base) */
export function sessionTotalEuros(
  session: SessionDuration,
  participantCount = 1,
): number {
  const base = session.billableHours * session.pricePerHourEuros;
  const extras = extraParticipantCount(participantCount);
  return base + extras * EXTRA_PERSON_SUPPLEMENT_EUROS[session.id];
}

export function sessionTotalCents(
  session: SessionDuration,
  participantCount = 1,
): number {
  return Math.round(sessionTotalEuros(session, participantCount) * 100);
}

/** Texto corto para tarifas y reserva */
export function formatExtraParticipantsNote(session: SessionDuration): string {
  const supplement = EXTRA_PERSON_SUPPLEMENT_EUROS[session.id];
  const max = MAX_PARTICIPANTS[session.id];
  if (session.id === "full-day") {
    return `Hasta ${max} personas · ${sessionTotalEuros(session)} € base · +${supplement} €/persona extra`;
  }
  return `Hasta ${max} personas (+${supplement} €/persona extra)`;
}

/** Ej. "55 €/h · 110 € total" */
export function formatSessionPrice(session: SessionDuration): string {
  const total = sessionTotalEuros(session);
  return `${session.pricePerHourEuros} €/h · ${total} € total`;
}

export function formatSessionPriceShort(session: SessionDuration): string {
  return `${sessionTotalEuros(session)} €`;
}
