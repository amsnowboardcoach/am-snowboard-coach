import Link from "next/link";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            AM <span className="text-sky-400">Snowboard</span> Coach
          </Link>
          <nav className="flex items-center gap-6 text-sm text-zinc-300">
            <Link href="/clases" className="hover:text-white">
              Clases
            </Link>
            <Link href="/tarifas" className="hover:text-white">
              Tarifas
            </Link>
            <Link href="/sobre-mi" className="hover:text-white">
              Sobre mí
            </Link>
            <Link
              href="/reservar"
              className="rounded-full bg-sky-500 px-4 py-2 font-medium text-zinc-950 hover:bg-sky-400"
            >
              Reservar
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-zinc-800 py-8 text-center text-sm text-zinc-500">
        © {new Date().getFullYear()} AM Snowboard Coach · Sierra Nevada
      </footer>
    </>
  );
}
