export const metadata = { title: "Panel Coach" };

export default function CoachDashboardPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-3xl font-bold">Panel del Coach</h1>
      <p className="mt-4 text-zinc-400">
        Aquí gestionarás agenda, progreso de alumnos y facturas manuales por
        reserva.
      </p>
      <ul className="mt-8 space-y-3 text-sm text-zinc-500">
        <li>· Reservas pagadas sin factura</li>
        <li>· Desbloqueo del Pasaporte de Trucos</li>
        <li>· Consejo del Coach + parte de nieve</li>
      </ul>
    </div>
  );
}
