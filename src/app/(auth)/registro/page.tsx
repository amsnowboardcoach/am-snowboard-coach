import { redirect } from "next/navigation";
import { ALUMNO_AREA_PATH } from "@/constants/alumno-area";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** /registro redirige al área de alumno unificada */
export default async function RegistroRedirectPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  params.set("registro", "1");
  const next = sp.next;
  if (typeof next === "string" && next.startsWith("/") && !next.startsWith("//")) {
    params.set("next", next);
  }
  redirect(`${ALUMNO_AREA_PATH}?${params.toString()}`);
}
