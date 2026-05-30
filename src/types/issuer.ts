import type { Timestamp } from "firebase/firestore";

/** Datos fiscales del emisor (coach / autónomo) — art. 6 RD 1619/2012 */
export interface IssuerConfig {
  legalName: string;
  taxId: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  email?: string;
  phone?: string;
  activityDescription?: string;
  updatedAt?: Timestamp;
}
