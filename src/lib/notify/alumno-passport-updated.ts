import { getAppBaseUrl } from "@/constants/project";
import { sendAlumnoPassportUpdatedEmail } from "@/lib/email/send-alumno-passport-updated";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  buildPassportUpdateMessage,
  type PassportUpdateMessageInput,
} from "@/lib/notify/passport-update-message";
import { sendPushToUser } from "@/lib/push/send-push";

const PASSPORT_PATH = "/perfil/pasaporte";

/** Push + email al alumno cuando el coach publica cambios en el pasaporte. */
export async function notifyAlumnoPassportUpdated(
  details: PassportUpdateMessageInput & { userId: string },
): Promise<void> {
  if (!details.userId) return;

  const trickUpdateCount = details.trickUpdateCount ?? 0;
  const sectionNoteCount = details.sectionNoteCount ?? 0;
  if (trickUpdateCount === 0 && sectionNoteCount === 0) return;

  const { title, pushBody, emailBody } = buildPassportUpdateMessage({
    trickUpdateCount,
    sectionNoteCount,
    highlightTrickName: details.highlightTrickName,
  });

  const passportUrl = `${getAppBaseUrl()}${PASSPORT_PATH}`;

  try {
    await sendPushToUser(details.userId, {
      title,
      body: pushBody,
      url: PASSPORT_PATH,
      tag: "passport-updated",
    });
  } catch (pushErr) {
    console.error("[notify/passport] push:", pushErr);
  }

  const userSnap = await getAdminDb()
    .collection("users")
    .doc(details.userId)
    .get();
  const profile = userSnap.data();
  const alumnoEmail =
    typeof profile?.email === "string" ? profile.email.trim() : "";
  const alumnoName =
    (typeof profile?.displayName === "string"
      ? profile.displayName.trim()
      : "") || "Alumno";

  if (!alumnoEmail) {
    console.warn(
      "[notify/passport] Sin email de alumno;",
      details.userId,
    );
    return;
  }

  try {
    await sendAlumnoPassportUpdatedEmail({
      alumnoName,
      alumnoEmail,
      title,
      body: emailBody,
      passportUrl,
    });
  } catch (emailErr) {
    console.error("[notify/passport] email:", emailErr);
  }
}
