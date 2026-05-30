import { redirect } from "next/navigation";
import { coachHubHref } from "@/constants/coach-hub";

export default function CoachAlumnosRedirectPage() {
  redirect(coachHubHref("alumnos"));
}
