const STEPS = [
  {
    title: "Explora el feed",
    description:
      "Fotos y vídeos de la comunidad en Sierra Nevada. No hace falta cuenta para ver el contenido.",
  },
  {
    title: "Reacciona y comenta",
    description:
      "Con tu cuenta de alumno puedes dar me gusta, comentar o compartir un enlace directo a una publicación.",
  },
  {
    title: "Publica si eres alumno",
    description:
      "Sube foto o vídeo desde tu panel de alumno; el coach lo aprueba antes de que salga en el feed.",
  },
] as const;

export function TribeHowItWorks() {
  return (
    <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
      {STEPS.map((step, index) => (
        <article
          key={step.title}
          className="glass-panel rounded-2xl p-5 sm:p-6"
        >
          <span
            className="inline-flex size-8 items-center justify-center rounded-full bg-sky-500/15 text-sm font-bold brand-text ring-1 ring-sky-500/30"
            aria-hidden
          >
            {index + 1}
          </span>
          <h2 className="mt-3 text-base font-semibold text-zinc-100">
            {step.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {step.description}
          </p>
        </article>
      ))}
    </div>
  );
}
