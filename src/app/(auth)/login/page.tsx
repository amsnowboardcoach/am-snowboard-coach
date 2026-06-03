import { Suspense } from "react";
import { AlumnoAreaAuthForm } from "@/components/auth/AlumnoAreaAuthForm";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ALUMNO_AREA_PATH } from "@/constants/alumno-area";

export const metadata = buildPageMetadata({
  title: "Área de alumno",
  description:
    "Entra o regístrate con Google o email. Alumnos: pasaporte, vídeos y reservas. Coach: panel de administración.",
  path: ALUMNO_AREA_PATH,
  noIndex: true,
});

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Cargando…</p>}>
      <AlumnoAreaAuthForm />
    </Suspense>
  );
}
