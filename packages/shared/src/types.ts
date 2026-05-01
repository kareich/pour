export type SpiritStatus = 'sealed' | 'open' | 'empty';
export type BarcodeType = 'EAN13' | 'UPC_A' | 'UPC_E';

export interface FlavorProfile {
  sweet: number;   // 0.0–1.0
  smoke: number;
  fruit: number;
  grain: number;
  spice: number;
  floral: number;
  body: number;
}

export interface Spirit {
  id: string;
  name: string;
  distilleryName: string;
  category: string;
  subcategory: string | null;
  abv: number | null;
  ageStatement: number | null;
  description: string | null;
  avgRating: number;
  ratingCount: number;
  imageUrl: string | null;
  flavor: FlavorProfile;
  matchScore?: number;
}

export interface ScanResult {
  spirit: Spirit;
  source: 'barcode' | 'ocr';
  confidence: number;
}

export interface User {
  id: string;
  clerkId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface TasteProfile extends FlavorProfile {
  userId: string;
  priceMin: number | null;
  priceMax: number | null;
  updatedAt: string;
}

export interface Rating {
  id: string;
  userId: string;
  spiritId: string;
  score: number;
  flavor: FlavorProfile;
  notes: string | null;
  createdAt: string;
}

export interface CollectionEntry {
  id: string;
  userId: string;
  spiritId: string;
  spirit: Spirit;
  bottleStatus: SpiritStatus;
  pricePaid: number | null;
  acquiredAt: string | null;
  notes: string | null;
}

export interface WishlistEntry {
  id: string;
  userId: string;
  spiritId: string;
  spirit: Spirit;
  targetPrice: number | null;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
}
