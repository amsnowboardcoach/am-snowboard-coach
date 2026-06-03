import { CoachRouteGuard } from "@/components/coach/CoachRouteGuard";

/** El panel usa ?tab= en la URL; evita prerender estático que bloquea el cambio de pestaña. */
export const dynamic = "force-dynamic";

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoachRouteGuard>{children}</CoachRouteGuard>;
}
