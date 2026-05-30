import { createHmac, timingSafeEqual } from "crypto";

/** Verifica x-cal-signature-256 (HMAC-SHA256 del body en crudo). */
export function verifyCalWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean {
  const received = signatureHeader.replace(/^sha256=/i, "").trim();
  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    const a = Buffer.from(received, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
