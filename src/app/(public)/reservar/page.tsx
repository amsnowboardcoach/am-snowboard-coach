import { Suspense } from "react";
import { BookingCancellationPolicy } from "@/components/booking/BookingCancellationPolicy";
import { ReservarTabs } from "@/components/booking/ReservarTabs";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { getSiteMedia } from "@/lib/pexels/site-media";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Reservar clase de snowboard",
  description:
    "Reserva online: señal del 30% o pago total con tarjeta. Alejandro confirma tu plaza; el resto en efectivo o Bizum en pista si aplica.",
  path: "/reservar",
  keywords: ["reservar clase snowboard Sierra Nevada", "reservas online Granada"],
});

export default async function ReservarPage() {
  const media = await getSiteMedia();

  return (
    <div>
      <PageHero
        eyebrow="Reservas online"
        title="Reserva en un minuto"
        subtitle="Elige día y turno, paga la señal (30%) o el total con tarjeta y te confirmo la plaza. También puedes escribirme por WhatsApp."
        imageSrc={media.reservar.image.src}
        imageAlt={media.reservar.image.alt}
        tall={false}
      />

      <section className="page-container section-pad-tight">
        <div className="content-form content-align-start glass-panel panel-pad rounded-2xl">
          <Suspense
            fallback={
              <p className="py-12 text-center text-zinc-500">Cargando reservas…</p>
            }
          >
            <ReservarTabs />
          </Suspense>
        </div>
        <div className="mt-10 stack-section sm:mt-12">
          <BookingCancellationPolicy />
          <p className="text-center text-sm text-zinc-500">
            También puedes reservar por WhatsApp (botón verde abajo a la izquierda).
            En la web ves disponibilidad y precio sin cuenta; al enviar la solicitud
            identifícate en un paso.
          </p>
        </div>
      </section>
    </div>
  );
}
