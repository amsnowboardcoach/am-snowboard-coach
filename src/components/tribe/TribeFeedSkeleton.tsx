export function TribeFeedSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Cargando publicaciones">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40"
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="size-9 rounded-full bg-zinc-800" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-28 rounded bg-zinc-800" />
              <div className="h-2 w-20 rounded bg-zinc-800/80" />
            </div>
          </div>
          <div className="aspect-[4/5] bg-zinc-800/60 sm:aspect-square" />
          <div className="space-y-2 px-4 py-4">
            <div className="h-8 w-40 rounded-lg bg-zinc-800" />
            <div className="h-3 w-full max-w-xs rounded bg-zinc-800/80" />
          </div>
        </div>
      ))}
    </div>
  );
}
