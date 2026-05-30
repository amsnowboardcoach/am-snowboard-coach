import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { DEFAULT_ISSUER } from "@/constants/issuer";
import { getFirebaseDb } from "@/lib/firebase/client";
import type { IssuerConfig } from "@/types/issuer";

const ISSUER_DOC = "system_config/issuer";

export async function getIssuerConfig(): Promise<IssuerConfig> {
  const snap = await getDoc(doc(getFirebaseDb(), ISSUER_DOC));
  if (snap.exists()) {
    return snap.data() as IssuerConfig;
  }
  return DEFAULT_ISSUER;
}

/** Crea o actualiza campos base del emisor en Firestore (idempotente) */
export async function ensureIssuerConfig(): Promise<IssuerConfig> {
  const ref = doc(getFirebaseDb(), ISSUER_DOC);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      ...DEFAULT_ISSUER,
      updatedAt: serverTimestamp(),
    });
    return DEFAULT_ISSUER;
  }
  const current = snap.data() as IssuerConfig;
  const patch: Partial<IssuerConfig> = {};
  if (!current.phone && DEFAULT_ISSUER.phone) {
    patch.phone = DEFAULT_ISSUER.phone;
  }
  if (Object.keys(patch).length > 0) {
    await setDoc(ref, { ...patch, updatedAt: serverTimestamp() }, { merge: true });
    return { ...current, ...patch };
  }
  return current;
}

export async function updateIssuerConfig(
  data: IssuerConfig,
): Promise<void> {
  await setDoc(
    doc(getFirebaseDb(), ISSUER_DOC),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function formatIssuerAddress(issuer: IssuerConfig): string {
  return `${issuer.address}, ${issuer.postalCode} ${issuer.city}, ${issuer.province}, ${issuer.country}`;
}
