export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-zinc-700/80" />
      </div>
      <p className="relative mx-auto w-fit bg-zinc-950 px-3 text-xs uppercase tracking-wider text-zinc-500">
        o
      </p>
    </div>
  );
}
