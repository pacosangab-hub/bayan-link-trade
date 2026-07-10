// LocalStorage-backed supplier listing store for demo mode.
import { useSyncExternalStore } from "react";

export type ListingStatus =
  | "Draft"
  | "Pending Review"
  | "Active"
  | "Needs Changes"
  | "Rejected"
  | "Paused"
  | "Archived";

export type PriceType = "fixed" | "range" | "quote";

export type SupplierListing = {
  id: string;
  supplierId: string;
  supplierName: string;
  industry: string;
  category: string;
  subcategory?: string;
  name: string;
  description: string;
  brand?: string;
  sku?: string;
  images: string[];
  unit: string;
  moq: number;
  priceType: PriceType;
  fixedPrice?: number;
  minPrice?: number;
  maxPrice?: number;
  bulkDiscount: boolean;
  sampleAvailable: boolean;
  leadTime: string;
  stockStatus: "In stock" | "Made to order" | "Pre-order" | "Limited stock";
  capacity?: string;
  regions?: string;
  pickupLocation?: string;
  deliveryAvailable: boolean;
  deliveryNotes?: string;
  specification?: string;
  certifications?: string;
  complianceDocs?: string;
  sdsRequired?: boolean;
  expiry?: string;
  batchTracking?: boolean;
  templateFields?: Record<string, string>;
  status: ListingStatus;
  reviewNotes?: string;
  createdAt: number;
  updatedAt: number;
  views: number;
  quoteRequests: number;
};

const KEY = "psg.supplier.listings.v1";

export const SENSITIVE_INDUSTRIES = [
  "Pharmaceutical & Health",
  "Personal Care & Cosmetics",
  "Food Manufacturing & FMCG",
  "Chemicals & Raw Materials",
  "Medical Supplies & Devices",
  "Agri Inputs & Feeds",
  "Mining & Energy",
];

export function isSensitive(industry: string) {
  return SENSITIVE_INDUSTRIES.includes(industry);
}

export const UNIT_OPTIONS = [
  "kg", "sack", "box", "carton", "bottle", "gallon",
  "roll", "piece", "set", "pallet", "drum", "bundle",
];

const listeners = new Set<() => void>();
let cache: SupplierListing[] | null = null;
const EMPTY: SupplierListing[] = [];

function loadFromStorage(): SupplierListing[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const seed = seedListings();
  try { localStorage.setItem(KEY, JSON.stringify(seed)); } catch {}
  return seed;
}

function read(): SupplierListing[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache === null) cache = loadFromStorage();
  return cache;
}

function emit() { listeners.forEach((l) => l()); }
function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }

function write(list: SupplierListing[]) {
  cache = list;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  emit();
}

export function useSupplierListings(): SupplierListing[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}


export function getListing(id: string) {
  return read().find((l) => l.id === id);
}

export function saveListing(l: SupplierListing) {
  const all = read();
  const idx = all.findIndex((x) => x.id === l.id);
  if (idx >= 0) all[idx] = { ...l, updatedAt: Date.now() };
  else all.push({ ...l, createdAt: Date.now(), updatedAt: Date.now() });
  write(all);
}

export function deleteListing(id: string) {
  write(read().filter((l) => l.id !== id));
}

export function updateStatus(id: string, status: ListingStatus, reviewNotes?: string) {
  const all = read();
  const l = all.find((x) => x.id === id);
  if (!l) return;
  l.status = status;
  if (reviewNotes !== undefined) l.reviewNotes = reviewNotes;
  l.updatedAt = Date.now();
  write(all);
}

export function duplicateListing(id: string) {
  const l = getListing(id);
  if (!l) return null;
  const copy: SupplierListing = {
    ...l,
    id: `sl_${Math.random().toString(36).slice(2, 9)}`,
    name: `${l.name} (Copy)`,
    status: "Draft",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    views: 0,
    quoteRequests: 0,
  };
  saveListing(copy);
  return copy;
}

export function newListingId() {
  return `sl_${Math.random().toString(36).slice(2, 9)}`;
}

// Placeholder image
export const PLACEHOLDER_IMG = "https://picsum.photos/seed/psg-listing/800/600";

// Convert active supplier listing to marketplace product shape
export function listingToProduct(l: SupplierListing) {
  const price = l.priceType === "fixed" ? (l.fixedPrice ?? 0)
    : l.priceType === "range" ? (l.minPrice ?? 0) : 0;
  return {
    id: l.id,
    supplierId: l.supplierId,
    title: l.name,
    category: l.category,
    industry: l.industry,
    unit: l.unit,
    moq: l.moq,
    pricePhp: price,
    tierPricing: [],
    leadTimeDays: parseInt(l.leadTime) || 3,
    image: l.images[0] || PLACEHOLDER_IMG,
    stock: l.stockStatus,
    description: l.description,
    origin: l.pickupLocation || l.regions || "Philippines",
    tags: [],
    restricted: isSensitive(l.industry),
    compliance: isSensitive(l.industry) ? "Compliance review" : undefined,
  };
}

function seedListings(): SupplierListing[] {
  const base = {
    supplierId: "sup_001",
    supplierName: "Bulacan Grain & Rice Mills Inc.",
    bulkDiscount: true,
    sampleAvailable: false,
    deliveryAvailable: true,
    views: 0,
    quoteRequests: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const rows: Omit<SupplierListing, "id">[] = [
    {
      ...base, industry: "Food Manufacturing & FMCG", category: "Rice & Grains",
      name: "Premium Well-Milled Rice 50kg Sack",
      description: "NFA-grade premium well-milled rice packed in 50kg sacks. Ideal for restaurants and caterers.",
      images: [PLACEHOLDER_IMG], unit: "sack", moq: 20, priceType: "fixed", fixedPrice: 2450,
      leadTime: "2–3 business days", stockStatus: "In stock",
      pickupLocation: "Malolos, Bulacan", status: "Active", views: 428, quoteRequests: 34,
    },
    {
      ...base, industry: "Packaging Materials", category: "Food Packaging",
      name: "Kraft Takeout Boxes 750ml",
      description: "Food-grade kraft takeout containers. 200 pcs per carton, ideal for cafes and cloud kitchens.",
      images: [PLACEHOLDER_IMG], unit: "carton", moq: 10, priceType: "fixed", fixedPrice: 1180,
      leadTime: "3–5 business days", stockStatus: "In stock",
      pickupLocation: "Valenzuela, NCR", status: "Pending Review", views: 12, quoteRequests: 0,
    },
    {
      ...base, industry: "Cleaning & Hygiene", category: "Dishwash",
      name: "Dishwashing Liquid 1-Gallon",
      description: "Concentrated dishwashing liquid, lemon scent, in 1-gallon jugs. Case of 4.",
      images: [PLACEHOLDER_IMG], unit: "gallon", moq: 12, priceType: "fixed", fixedPrice: 320,
      leadTime: "1–2 business days", stockStatus: "In stock",
      pickupLocation: "Cavite", status: "Active", views: 214, quoteRequests: 18,
    },
    {
      ...base, industry: "Construction Materials", category: "Cement",
      name: "Portland Cement Type 1 — 40kg Bag",
      description: "General-purpose Portland cement, PNS-certified.",
      images: [PLACEHOLDER_IMG], unit: "bundle", moq: 50, priceType: "fixed", fixedPrice: 260,
      leadTime: "3–7 business days", stockStatus: "In stock",
      pickupLocation: "Batangas", status: "Needs Changes",
      reviewNotes: "Please add PNS certificate photo and clarify delivery scope.",
      views: 55, quoteRequests: 4,
    },
    {
      ...base, industry: "Medical Supplies & Devices", category: "PPE",
      name: "Medical Face Masks — 3ply Box of 50",
      description: "FDA-notified 3-ply medical face masks. Box of 50 pcs.",
      images: [PLACEHOLDER_IMG], unit: "box", moq: 100, priceType: "range", minPrice: 55, maxPrice: 75,
      leadTime: "5–7 business days", stockStatus: "Made to order",
      pickupLocation: "Laguna", status: "Pending Review",
      certifications: "FDA notification, ISO 13485", views: 8, quoteRequests: 1,
    },
  ];
  return rows.map((r) => ({ ...r, id: `sl_seed_${Math.random().toString(36).slice(2, 7)}` }));
}
