import {
  BOOKING_BALANCE_ON_SLOPE,
  BOOKING_DEPOSIT_PERCENT,
  type BookingPaymentOption,
} from "@/constants/booking-payment";
import { getAppBaseUrl } from "@/constants/project";
import { formatBookingWhen } from "@/lib/booking/format-datetime";

export interface CoachBookingWhatsAppDetails {
  bookingId: string;
  studentName: string;
  studentEmail: string;
  lessonTypeName: string;
  sessionLabel: string;
  startAt: Date;
  endAt: Date;
  participantCount?: number;
  chargeEuros: number;
  totalEuros?: number;
  balanceEuros?: number;
  paymentOption?: BookingPaymentOption;
  bookingNotes?: string;
  /** Varias clases en un solo pago */
  sessions?: { slotLabel: string; startAt: Date; endAt: Date }[];
}

function coachNotifyPhoneDigits(): string {
  const raw =
    process.env.COACH_WHATSAPP_NOTIFY_PHONE?.trim() ||
    process.env.NEXT_PUBLIC_COACH_WHATSAPP?.trim() ||
    "34617354031";
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 9) return digits;
  return "34617354031";
}

export function isCoachWhatsAppNotifyConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_WHATSAPP_FROM?.trim(),
  ) || Boolean(process.env.CALLMEBOT_API_KEY?.trim());
}

export function buildCoachBookingPaidWhatsAppMessage(
  details: CoachBookingWhatsAppDetails,
): string {
  const panelUrl = `${getAppBaseUrl()}/coach?tab=reservas`;
  const people =
    details.participantCount && details.participantCount > 1
      ? `${details.participantCount} personas en pista`
      : "1 persona en pista";

  let paymentLine: string;
  if (details.paymentOption === "deposit_30") {
    paymentLine = `Pago tarjeta: ${details.chargeEuros} € (señal ${BOOKING_DEPOSIT_PERCENT}%)`;
    if (details.balanceEuros != null && details.balanceEuros > 0) {
      paymentLine += ` · Resto ${details.balanceEuros} € en ${BOOKING_BALANCE_ON_SLOPE}`;
    }
  } else {
    paymentLine = `Pago tarjeta: ${details.chargeEuros} € (total)`;
  }

  const totalLine =
    details.totalEuros != null && details.totalEuros !== details.chargeEuros
      ? `Importe clase(s): ${details.totalEuros} €`
      : null;

  const whenLines =
    details.sessions && details.sessions.length > 1
      ? details.sessions
          .map(
            (s, i) =>
              `  ${i + 1}. ${formatBookingWhen(s.startAt, s.endAt)} · ${s.slotLabel}`,
          )
          .join("\n")
      : `  ${formatBookingWhen(details.startAt, details.endAt)} · ${details.sessionLabel}`;

  const notesLine = details.bookingNotes?.trim()
    ? `Notas: ${details.bookingNotes.trim().slice(0, 200)}`
    : null;

  return [
    "Nueva reserva AM Snowboard Coach",
    "Pago recibido — acepta o rechaza en el panel",
    "",
    `Alumno: ${details.studentName}`,
    `Email: ${details.studentEmail}`,
    `Estilo: ${details.lessonTypeName}`,
    `Modalidad: ${details.sessionLabel}`,
    `Personas: ${people}`,
    "Fecha(s):",
    whenLines,
    paymentLine,
    totalLine,
    notesLine,
    "",
    `Panel: ${panelUrl}`,
    `Ref: ${details.bookingId.slice(0, 8)}`,
  ]
    .filter((line): line is string => line != null && line !== "")
    .join("\n");
}

async function sendViaTwilio(phone: string, body: string): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim();
  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio WhatsApp no configurado");
  }

  const to = `whatsapp:+${phone}`;
  const fromAddr = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  const params = new URLSearchParams({
    From: fromAddr,
    To: to,
    Body: body,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Twilio ${res.status}: ${errText.slice(0, 200)}`);
  }
}

async function sendViaCallMeBot(phone: string, body: string): Promise<void> {
  const apiKey = process.env.CALLMEBOT_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("CallMeBot no configurado");
  }

  const url = new URL("https://api.callmebot.com/whatsapp.php");
  url.searchParams.set("phone", phone);
  url.searchParams.set("text", body);
  url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString());
  const text = await res.text();
  if (!res.ok || /ERROR/i.test(text)) {
    throw new Error(`CallMeBot: ${text.slice(0, 200)}`);
  }
}

/** Envía WhatsApp al coach (Twilio si está configurado; si no, CallMeBot). */
export async function sendCoachBookingPaidWhatsApp(
  details: CoachBookingWhatsAppDetails,
): Promise<void> {
  if (!isCoachWhatsAppNotifyConfigured()) {
    console.warn(
      "[whatsapp] Sin TWILIO_* ni CALLMEBOT_API_KEY; omitiendo aviso al coach",
    );
    return;
  }

  const phone = coachNotifyPhoneDigits();
  const message = buildCoachBookingPaidWhatsAppMessage(details);

  const twilioReady = Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_WHATSAPP_FROM?.trim(),
  );

  if (twilioReady) {
    try {
      await sendViaTwilio(phone, message);
      return;
    } catch (err) {
      console.error("[whatsapp] Twilio falló:", err);
      if (!process.env.CALLMEBOT_API_KEY?.trim()) throw err;
    }
  }

  await sendViaCallMeBot(phone, message);
}
