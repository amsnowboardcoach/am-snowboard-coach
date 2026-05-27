export const metadata = { title: "Sobre mí" };

export default function SobreMiPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">Alejandro Martín</h1>
      <p className="mt-2 text-sky-400">Fundador & Head Coach · AM Snowboard Coach</p>
      <div className="mt-8 space-y-4 text-zinc-300">
        <p>
          15 temporadas enseñando snowboard en Sierra Nevada. Más de 7.500 horas
          de clase en pista con alumnos de todos los niveles.
        </p>
        <p>
          Mi enfoque combina técnica sólida, seguridad y progresión gamificada
          para que cada sesión tenga un objetivo claro — y ganas de volver.
        </p>
      </div>
    </div>
  );
}
