import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Iniciar sesión",
  description:
    "Entra con Google o email a tu área de alumno: pasaporte de trucos, vídeos con corrección del coach y La Tribu.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">Cargando…</p>}>
      <LoginForm />
    </Suspense>
  );
}
