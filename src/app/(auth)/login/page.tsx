import { Suspense } from "react";
import { StudentAreaAuthForm } from "@/components/auth/StudentAreaAuthForm";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { STUDENT_AREA_PATH } from "@/constants/student-area";

export const metadata = buildPageMetadata({
  title: "Área de alumno",
  description:
    "Entra o regístrate con Google o email. Alumnos: pasaporte, vídeos y reservas. Coach: panel de administración.",
  path: STUDENT_AREA_PATH,
  noIndex: true,
});

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Cargando…</p>}>
      <StudentAreaAuthForm />
    </Suspense>
  );
}
