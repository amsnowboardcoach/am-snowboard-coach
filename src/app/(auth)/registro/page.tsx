import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/RegisterForm";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Crear cuenta de alumno",
  description:
    "Regístrate gratis con Google o email. Progreso, vídeos, La Tribu y WhatsApp directo con el coach para dudas y reservas en Sierra Nevada.",
  path: "/registro",
  noIndex: true,
});

export default function RegistroPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Cargando…</p>}>
      <RegisterForm />
    </Suspense>
  );
}
