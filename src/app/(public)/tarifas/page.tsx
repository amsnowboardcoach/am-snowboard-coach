export const metadata = { title: "Tarifas" };

export default function TarifasPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">Tarifas</h1>
      <p className="mt-4 text-zinc-400">
        Las tarifas definitivas se configurarán en el panel del coach. Mientras
        tanto, reserva y te confirmo precio según tipo de clase y duración.
      </p>
      <p className="mt-8 rounded-xl border border-dashed border-zinc-700 p-6 text-sm text-zinc-500">
        Próximo paso: conectar Stripe Checkout y Cal.com en la página de
        reservar.
      </p>
    </div>
  );
}
