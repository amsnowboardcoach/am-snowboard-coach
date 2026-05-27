import { LESSON_TYPES } from "@/constants/lesson-types";

export const metadata = { title: "Clases" };

export default function ClasesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">Tipos de clase</h1>
      <p className="mt-4 text-zinc-400">
        Cada sesión se adapta a tu nivel y objetivos del día en Sierra Nevada.
      </p>
      <ul className="mt-10 space-y-8">
        {LESSON_TYPES.map((lesson) => (
          <li
            key={lesson.id}
            className="border-b border-zinc-800 pb-8 last:border-0"
          >
            <h2 className="text-xl font-semibold text-sky-400">
              {lesson.name}
            </h2>
            <p className="mt-2 text-zinc-300">{lesson.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
