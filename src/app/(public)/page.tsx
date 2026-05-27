import Link from "next/link";
import { LESSON_TYPES } from "@/constants/lesson-types";

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/40 via-zinc-950 to-zinc-950" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-sky-400">
            Sierra Nevada · Pradollano
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Clases de snowboard con método y actitud
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            Soy Alejandro Martín, Head Coach con más de 7.500 horas en pista. De
            la iniciación al freestyle en Sulayr: progresa con un plan claro y
            comunidad real.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/reservar"
              className="rounded-full bg-sky-500 px-8 py-3 font-semibold text-zinc-950 hover:bg-sky-400"
            >
              Reservar clase
            </Link>
            <Link
              href="/clases"
              className="rounded-full border border-zinc-700 px-8 py-3 font-semibold hover:border-zinc-500"
            >
              Ver tipos de clase
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="mb-8 text-center text-2xl font-bold">Tipos de clase</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {LESSON_TYPES.map((lesson) => (
            <article
              key={lesson.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
            >
              <h3 className="text-lg font-semibold text-sky-400">
                {lesson.name}
              </h3>
              <p className="mt-2 text-sm text-zinc-400">{lesson.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
