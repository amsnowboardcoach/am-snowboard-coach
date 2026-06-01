import Link from "next/link";
import { reservarHref } from "@/lib/booking/reservar-url";

const STEPS = [
  {
    n: 1,
    title: "Elige duración y estilo",
    body: "2 h, 3 h o día completo. Iniciación, carving o freestyle en Snowpark Sulayr.",
  },
  {
    n: 2,
    title: "Marca día y turno",
    body: "Calendario en vivo con huecos libres.",
  },
  {
    n: 3,
    title: "Confirma y paga",
    body: "Reviso tu solicitud; si hay plaza, pagas con tarjeta o lo acordamos por WhatsApp.",
  },
] as const;

export function ClasesBookingSteps({ className }: { className?: string }) {
  return (
    <div className={className}>
      <ol className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="surface-elevated p-5"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-sm font-bold brand-text ring-1 ring-sky-500/25">
              {step.n}
            </span>
            <h3 className="mt-3 font-semibold text-zinc-100">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-center">
        <Link
          href={reservarHref()}
          className="btn-primary-lg text-sm"
        >
          Ir al calendario y reservar
        </Link>
      </p>
    </div>
  );
}
