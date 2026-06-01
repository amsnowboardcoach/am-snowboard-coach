import { getMessaging } from "firebase-admin/messaging";
import { getAdminApp, getAdminDb } from "@/lib/firebase/admin";
import { resolveCoachPushUserIds } from "@/lib/push/coach-push-targets";
import { getAppBaseUrl } from "@/constants/project";
import {
  formatBookingInTimeZone,
  formatBookingWhen,
} from "@/lib/booking/format-datetime";
import { isVideoCorrectionProduct } from "@/constants/video-correction";

function messaging() {
  return getMessaging(getAdminApp());
}

type TokenRef = { userId: string; token: string; docId: string };

async function listTokenRefs(userId: string): Promise<TokenRef[]> {
  const snap = await getAdminDb()
    .collection("users")
    .doc(userId)
    .collection("fcm_tokens")
    .get();
  return snap.docs
    .map((d) => ({
      userId,
      token: d.data().token as string,
      docId: d.id,
    }))
    .filter((r) => Boolean(r.token));
}

async function pruneInvalidTokenRefs(
  refs: TokenRef[],
  responses: { success: boolean; error?: { code?: string } }[],
): Promise<void> {
  const db = getAdminDb();
  await Promise.all(
    responses.map(async (res, i) => {
      if (res.success) return;
      const code = res.error?.code;
      if (
        code !== "messaging/registration-token-not-registered" &&
        code !== "messaging/invalid-argument"
      ) {
        return;
      }
      const ref = refs[i];
      if (!ref) return;
      try {
        await db
          .collection("users")
          .doc(ref.userId)
          .collection("fcm_tokens")
          .doc(ref.docId)
          .delete();
      } catch {
        /* ignore */
      }
    }),
  );
}

async function sendMulticast(
  refs: TokenRef[],
  payload: PushPayload,
): Promise<void> {
  if (refs.length === 0) return;

  const tokens = refs.map((r) => r.token);
  const base = getAppBaseUrl();
  const url = payload.url?.startsWith("http")
    ? payload.url
    : `${base}${payload.url ?? "/"}`;

  const result = await messaging().sendEachForMulticast({
    tokens,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      url,
      tag: payload.tag ?? "default",
      title: payload.title,
      body: payload.body,
    },
    webpush: {
      fcmOptions: { link: url },
    },
  });

  await pruneInvalidTokenRefs(refs, result.responses);

  if (result.failureCount > 0) {
    console.warn(
      `[push] ${result.failureCount}/${tokens.length} envíos fallidos`,
      payload.tag,
    );
  }
}

/** Push a todos los dispositivos del coach (UID env + cuenta por email). */
async function sendPushToCoach(payload: PushPayload): Promise<void> {
  const userIds = await resolveCoachPushUserIds();
  if (userIds.length === 0) {
    console.warn(
      "[push] Sin UIDs de coach. Configura NEXT_PUBLIC_DEFAULT_COACH_ID o el email del coach en Firestore.",
    );
    return;
  }

  const seen = new Set<string>();
  const refs: TokenRef[] = [];
  for (const userId of userIds) {
    for (const ref of await listTokenRefs(userId)) {
      if (seen.has(ref.token)) continue;
      seen.add(ref.token);
      refs.push(ref);
    }
  }

  if (refs.length === 0) {
    console.warn(
      "[push] Coach sin tokens FCM. En el móvil: entra en /coach y pulsa «Activar» en el banner de avisos.",
      { coachUserIds: userIds },
    );
    return;
  }

  try {
    await sendMulticast(refs, payload);
  } catch (err) {
    console.error("[push] sendToCoach", err);
  }
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  if (!userId) return;

  const refs = await listTokenRefs(userId);
  if (refs.length === 0) return;

  try {
    await sendMulticast(refs, payload);
  } catch (err) {
    console.error("[push] sendToUser", userId, err);
  }
}

/** Coach: nueva solicitud de clase en pista */
export async function notifyCoachNewSessionRequest(details: {
  studentName: string;
  slotLabel: string;
  startAt: Date;
  endAt: Date;
  bookingId: string;
}): Promise<void> {
  const when = formatBookingWhen(details.startAt, details.endAt);
  await sendPushToCoach({
    title: "Nueva solicitud de clase",
    body: `${details.studentName} · ${when}`,
    url: "/coach?tab=reservas",
    tag: `booking-${details.bookingId}`,
  });
}

/** Coach: nueva solicitud de video corrección (reserva) */
export async function notifyCoachNewVideoCorrectionRequest(details: {
  studentName: string;
  videoCount: number;
  bookingId: string;
}): Promise<void> {
  const n = details.videoCount;
  const label = `${n} vídeo${n > 1 ? "s" : ""} a corregir`;
  await sendPushToCoach({
    title: "Nueva solicitud de video corrección",
    body: `${details.studentName} · ${label}`,
    url: "/coach?tab=reservas",
    tag: `booking-${details.bookingId}`,
  });
}

/** Coach: nuevo alumno en el área de alumno (registro Google o email) */
export async function notifyCoachNewStudentRegistered(details: {
  studentName: string;
  studentEmail: string;
  studentId: string;
}): Promise<void> {
  await sendPushToCoach({
    title: "Nuevo alumno registrado",
    body: `${details.studentName} · ${details.studentEmail}`,
    url: "/coach?tab=alumnos",
    tag: `student-reg-${details.studentId}`,
  });
}

/** Coach: alumno subió vídeo en su área */
export async function notifyCoachStudentVideoUploaded(details: {
  studentName: string;
  videoTitle: string;
  studentId: string;
}): Promise<void> {
  await sendPushToCoach({
    title: "Vídeo nuevo de un alumno",
    body: `${details.studentName}: «${details.videoTitle}» — pendiente de revisión`,
    url: `/coach/alumnos/${details.studentId}`,
    tag: `video-upload-${details.studentId}`,
  });
}

/** Alumno: clase en pista confirmada */
export async function notifyStudentSessionConfirmed(details: {
  userId: string;
  startAt: Date;
  endAt: Date;
  slotLabel: string;
  paymentUrl?: string;
}): Promise<void> {
  if (!details.userId) return;

  const when = formatBookingWhen(details.startAt, details.endAt);
  if (details.paymentUrl) {
    await sendPushToUser(details.userId, {
      title: "¡Clase confirmada! Completa el pago",
      body: `${when} · Borreguiles (Al-Andalus). Toca para pagar con tarjeta.`,
      url: details.paymentUrl,
      tag: "booking-confirmed-pay",
    });
    return;
  }

  await sendPushToUser(details.userId, {
    title: "¡Tu clase está confirmada!",
    body: `${when} · Encuentro en Borreguiles (Al-Andalus). Revisa tu email.`,
    url: "/perfil",
    tag: "booking-confirmed",
  });
}

/** Alumno: video corrección (reserva) confirmada */
export async function notifyStudentVideoCorrectionConfirmed(details: {
  userId: string;
  videoCount: number;
  paymentUrl?: string;
}): Promise<void> {
  if (!details.userId) return;

  const n = details.videoCount;
  const label = `${n} vídeo${n > 1 ? "s" : ""}`;

  if (details.paymentUrl) {
    await sendPushToUser(details.userId, {
      title: "Video corrección confirmada — paga ahora",
      body: `${label} · Toca para pagar y enviar tu material`,
      url: details.paymentUrl,
      tag: "video-booking-pay",
    });
    return;
  }

  await sendPushToUser(details.userId, {
    title: "Video corrección confirmada",
    body: `Puedes subir ${label} desde tu área de vídeos cuando quieras.`,
    url: "/perfil/videos",
    tag: "video-booking-confirmed",
  });
}

/** Alumno: clase no confirmada */
export async function notifyStudentSessionRejected(details: {
  userId: string;
  startAt: Date;
  endAt: Date;
}): Promise<void> {
  if (!details.userId) return;

  const when = formatBookingWhen(details.startAt, details.endAt);
  await sendPushToUser(details.userId, {
    title: "Clase no disponible",
    body: `No hemos podido confirmar: ${when}. Elige otra fecha en la web.`,
    url: "/reservar",
    tag: "booking-rejected",
  });
}

/** Alumno: video corrección (reserva) no confirmada */
export async function notifyStudentVideoCorrectionRejected(details: {
  userId: string;
}): Promise<void> {
  if (!details.userId) return;

  await sendPushToUser(details.userId, {
    title: "Solicitud de vídeo no confirmada",
    body: "Puedes enviar otra solicitud de video corrección cuando quieras.",
    url: "/reservar?tipo=video",
    tag: "video-booking-rejected",
  });
}

/** Alumno: pago recibido correctamente */
export async function notifyStudentPaymentReceived(details: {
  userId: string;
  amountEuros: number;
  productLabel: string;
  startAt?: Date;
}): Promise<void> {
  if (!details.userId) return;

  const when = details.startAt
    ? formatBookingInTimeZone(details.startAt, "EEE d MMM · HH:mm")
    : null;

  await sendPushToUser(details.userId, {
    title: "Pago recibido — gracias",
    body: when
      ? `${details.productLabel} · ${details.amountEuros} € · ${when}. Te avisamos cuando Alejandro acepte tu plaza.`
      : `${details.productLabel} · ${details.amountEuros} € registrados. Te avisamos cuando acepte tu plaza.`,
    url: "/perfil",
    tag: "payment-received",
  });
}

/** Coach: alumno ha pagado una reserva */
export async function notifyCoachPaymentReceived(details: {
  studentName: string;
  amountEuros: number;
  productLabel: string;
  bookingId: string;
}): Promise<void> {
  await sendPushToCoach({
    title: "Pago recibido — acepta la reserva",
    body: `${details.studentName} · ${details.productLabel} · ${details.amountEuros} €`,
    url: "/coach?tab=reservas",
    tag: `paid-${details.bookingId}`,
  });
}

/** Alumno: el coach publicó apuntes en un vídeo */
export async function notifyStudentVideoReviewReady(details: {
  userId: string;
  videoTitle: string;
}): Promise<void> {
  if (!details.userId) return;

  await sendPushToUser(details.userId, {
    title: "¡Tu vídeo ya tiene corrección!",
    body: `Alejandro ha publicado apuntes en «${details.videoTitle}». Ábrelos en Mis vídeos.`,
    url: "/perfil/videos",
    tag: "video-reviewed",
  });
}

/** Compat: reserva genérica → delega según tipo */
export async function notifyCoachNewBookingRequest(details: {
  studentName: string;
  slotLabel: string;
  dateLabel: string;
  bookingId: string;
  kind?: "session" | "video_correction";
  startAt?: Date;
  endAt?: Date;
  videoCount?: number;
}): Promise<void> {
  if (details.kind === "video_correction") {
    await notifyCoachNewVideoCorrectionRequest({
      studentName: details.studentName,
      videoCount: details.videoCount ?? 1,
      bookingId: details.bookingId,
    });
    return;
  }

  if (details.startAt && details.endAt) {
    await notifyCoachNewSessionRequest({
      studentName: details.studentName,
      slotLabel: details.slotLabel,
      startAt: details.startAt,
      endAt: details.endAt,
      bookingId: details.bookingId,
    });
    return;
  }

  await sendPushToCoach({
    title: "Nueva solicitud de reserva",
    body: `${details.studentName} · ${details.dateLabel} · ${details.slotLabel}`,
    url: "/coach?tab=reservas",
    tag: `booking-${details.bookingId}`,
  });
}

/** Compat: confirmación genérica */
export async function notifyStudentBookingConfirmed(details: {
  userId: string;
  dateLabel: string;
  slotLabel: string;
  paymentUrl?: string;
  startAt?: Date;
  endAt?: Date;
  isVideoCorrection?: boolean;
  videoCount?: number;
}): Promise<void> {
  if (details.isVideoCorrection) {
    await notifyStudentVideoCorrectionConfirmed({
      userId: details.userId,
      videoCount: details.videoCount ?? 1,
      paymentUrl: details.paymentUrl,
    });
    return;
  }

  if (details.startAt && details.endAt) {
    await notifyStudentSessionConfirmed({
      userId: details.userId,
      startAt: details.startAt,
      endAt: details.endAt,
      slotLabel: details.slotLabel,
      paymentUrl: details.paymentUrl,
    });
    return;
  }

  await sendPushToUser(details.userId, {
    title: details.paymentUrl ? "Reserva confirmada — paga ahora" : "Reserva confirmada",
    body: details.paymentUrl
      ? `${details.dateLabel} · Toca para pagar con tarjeta`
      : `${details.dateLabel} · ${details.slotLabel}`,
    url: details.paymentUrl ?? "/perfil",
    tag: "booking-confirmed",
  });
}

/** Compat: rechazo genérico */
export async function notifyStudentBookingRejected(details: {
  userId: string;
  dateLabel: string;
  isVideoCorrection?: boolean;
  startAt?: Date;
  endAt?: Date;
}): Promise<void> {
  if (details.isVideoCorrection) {
    await notifyStudentVideoCorrectionRejected({ userId: details.userId });
    return;
  }

  if (details.startAt && details.endAt) {
    await notifyStudentSessionRejected({
      userId: details.userId,
      startAt: details.startAt,
      endAt: details.endAt,
    });
    return;
  }

  await sendPushToUser(details.userId, {
    title: "Solicitud no confirmada",
    body: `${details.dateLabel}. Prueba otra fecha en la web.`,
    url: "/reservar",
    tag: "booking-rejected",
  });
}

export async function notifyAfterBookingPaid(booking: {
  id: string;
  userId: string;
  studentDisplayName?: string;
  studentEmail?: string;
  lessonTypeId: string;
  lessonTypeName: string;
  productKind?: string;
  sessionDurationId?: string | null;
  sessionSlotLabel?: string;
  startAt: Date;
  endAt: Date;
  amountCents: number;
}): Promise<void> {
  const amountEuros = Math.round(booking.amountCents / 100);
  const studentName =
    booking.studentDisplayName || booking.studentEmail || "Alumno";
  const isVideo =
    booking.productKind === "video_correction" ||
    isVideoCorrectionProduct(booking.lessonTypeId);

  const productLabel = isVideo
    ? "Video corrección"
    : booking.sessionSlotLabel || booking.lessonTypeName;

  if (booking.userId) {
    await notifyStudentPaymentReceived({
      userId: booking.userId,
      amountEuros,
      productLabel,
      startAt: isVideo ? undefined : booking.startAt,
    });
  }

  await notifyCoachPaymentReceived({
    studentName,
    amountEuros,
    productLabel,
    bookingId: booking.id,
  });
}
