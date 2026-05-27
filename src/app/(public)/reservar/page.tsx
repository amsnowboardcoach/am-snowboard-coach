export const metadata = { title: "Reservar" };

export default function ReservarPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">Reservar clase</h1>
      <p className="mt-4 text-zinc-400">
        Aquí integraremos el calendario de Cal.com sincronizado con Google
        Calendar y el pago con Stripe.
      </p>
      <div className="mt-10 min-h-[400px] rounded-xl border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500">
        Widget Cal.com — próximamente
      </div>
    </div>
  );
}
