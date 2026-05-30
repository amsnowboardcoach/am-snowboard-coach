import type { Timestamp } from "firebase/firestore";

export type MarketplaceListingStatus = "active" | "sold";

export type MarketplaceCondition = "new" | "like_new" | "used";

export type MarketplaceCategory =
  | "tabla"
  | "fijaciones"
  | "botas"
  | "ropa"
  | "cascos"
  | "mochilas"
  | "accesorios"
  | "otros";

export interface MarketplaceListing {
  id: string;
  sellerId: string;
  sellerDisplayName: string;
  title: string;
  description: string;
  priceEuros: number;
  condition: MarketplaceCondition;
  category: MarketplaceCategory;
  imageUrls: string[];
  storagePaths: string[];
  contactPhone?: string;
  contactEmail?: string;
  status: MarketplaceListingStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
