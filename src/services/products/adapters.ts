import type { Product } from "@/lib/mock-data";
import type { ListingStatus, PriceType, SupplierListing } from "@/lib/supplier-listings";

export type MarketplaceProductRow = {
  id: string;
  title: string;
  description?: string | null;
  unit?: string | null;
  moq?: number | null;
  minimum_order_quantity?: number | null;
  fixed_price?: number | null;
  price_min?: number | null;
  price_max?: number | null;
  price_type?: string | null;
  images?: string[] | null;
  lead_time?: string | null;
  location?: string | null;
  region?: string | null;
  stock_status?: string | null;
  listing_status?: string | null;
  compliance_status?: string | null;
  tags?: string[] | null;
  brand?: string | null;
  sku?: string | null;
  category_name?: string | null;
  industry_group?: string | null;
  supplier_business_id?: string;
  supplier_name?: string | null;
  supplier_verification_status?: string | null;
  supplier_location?: string | null;
  supplier_region?: string | null;
  supplier_rating?: number | null;
  is_gold_supplier?: boolean | null;
  tier_pricing?: { qty: number; price: number }[] | null;
  review_notes?: string | null;
  created_at?: string;
  updated_at?: string;
  inventory?: {
    available?: number;
    reserved?: number;
    incoming?: number;
    unit?: string | null;
    low_stock_threshold?: number;
    tracking_type?: string;
    paused?: boolean;
    restock_date?: string | null;
    lead_time?: string | null;
  } | null;
  inventory_available?: number | null;
  inventory_tracking_type?: string | null;
  inventory_paused?: boolean | null;
};

const LISTING_STATUS_TO_UI: Record<string, ListingStatus> = {
  draft: "Draft",
  pending_review: "Pending Review",
  active: "Active",
  needs_changes: "Needs Changes",
  rejected: "Rejected",
  paused: "Paused",
  archived: "Archived",
};

const UI_STATUS_TO_DB: Record<ListingStatus, string> = {
  Draft: "draft",
  "Pending Review": "pending_review",
  Active: "active",
  "Needs Changes": "needs_changes",
  Rejected: "rejected",
  Paused: "paused",
  Archived: "archived",
};

const STOCK_TO_UI: Record<string, SupplierListing["stockStatus"]> = {
  in_stock: "In stock",
  low_stock: "Limited stock",
  out_of_stock: "Limited stock",
  made_to_order: "Made to order",
};

export function listingStatusToUi(status: string | null | undefined): ListingStatus {
  if (!status) return "Draft";
  return LISTING_STATUS_TO_UI[status] ?? "Draft";
}

export function listingStatusToDb(status: ListingStatus): string {
  return UI_STATUS_TO_DB[status];
}

export function priceTypeToUi(priceType: string | null | undefined): PriceType {
  if (priceType === "range") return "range";
  if (priceType === "quote_only" || priceType === "quote") return "quote";
  return "fixed";
}

export function priceTypeToDb(priceType: PriceType): string {
  if (priceType === "quote") return "quote_only";
  return priceType;
}

function parseLeadTimeDays(leadTime: string | null | undefined): number {
  if (!leadTime) return 3;
  const match = leadTime.match(/(\d+)/);
  return match ? Number(match[1]) : 3;
}

function displayPrice(row: MarketplaceProductRow): number {
  if (typeof row.fixed_price === "number") return row.fixed_price;
  if (typeof row.price_min === "number") return row.price_min;
  return 0;
}

function stockLabel(row: MarketplaceProductRow): string {
  if (row.inventory_paused || row.inventory?.paused) return "Paused";
  if (row.inventory_tracking_type === "made_to_order" || row.inventory?.tracking_type === "made_to_order") {
    return "Made to order";
  }
  const available = row.inventory_available ?? row.inventory?.available;
  if (typeof available === "number") {
    if (available <= 0) return "Out of stock";
    if (available <= (row.inventory?.low_stock_threshold ?? 0)) return "Low stock";
    return "In stock";
  }
  return row.stock_status?.replaceAll("_", " ") ?? "In stock";
}

export function dbRowToProduct(row: MarketplaceProductRow): Product {
  const images = row.images ?? [];
  const tiers = Array.isArray(row.tier_pricing) ? row.tier_pricing : [];
  return {
    id: row.id,
    supplierId: row.supplier_business_id || "unknown",
    title: row.title,
    category: row.category_name || "General",
    industry: row.industry_group || undefined,
    unit: row.unit || "unit",
    moq: row.moq ?? row.minimum_order_quantity ?? 1,
    pricePhp: displayPrice(row),
    tierPricing: tiers.map((t) => ({ qty: Number(t.qty), price: Number(t.price) })),
    leadTimeDays: parseLeadTimeDays(row.lead_time),
    image: images[0] || "",
    stock: stockLabel(row),
    description: row.description || "",
    origin: row.location || row.region || row.supplier_location || "",
    tags: row.tags ?? undefined,
    restricted: row.compliance_status === "restricted",
    compliance: row.compliance_status || undefined,
  };
}

export function dbRowToSupplierListing(row: MarketplaceProductRow): SupplierListing {
  const images = row.images ?? [];
  const created = row.created_at ? Date.parse(row.created_at) : Date.now();
  const updated = row.updated_at ? Date.parse(row.updated_at) : created;
  return {
    id: row.id,
    supplierId: row.supplier_business_id || "",
    supplierName: row.supplier_name || "Supplier",
    industry: row.industry_group || "",
    category: row.category_name || "General",
    name: row.title,
    description: row.description || "",
    brand: row.brand || undefined,
    sku: row.sku || undefined,
    images: images.length ? images : [""],
    unit: row.unit || "unit",
    moq: row.moq ?? row.minimum_order_quantity ?? 1,
    priceType: priceTypeToUi(row.price_type),
    fixedPrice: row.fixed_price ?? undefined,
    minPrice: row.price_min ?? undefined,
    maxPrice: row.price_max ?? undefined,
    bulkDiscount: (row.tier_pricing?.length ?? 0) > 0,
    sampleAvailable: false,
    leadTime: row.lead_time || "",
    stockStatus: STOCK_TO_UI[row.stock_status || "in_stock"] ?? "In stock",
    regions: Array.isArray(row.tags) ? undefined : undefined,
    pickupLocation: row.location || undefined,
    deliveryAvailable: true,
    status: listingStatusToUi(row.listing_status),
    reviewNotes: row.review_notes || undefined,
    createdAt: Number.isFinite(created) ? created : Date.now(),
    updatedAt: Number.isFinite(updated) ? updated : Date.now(),
    views: 0,
    quoteRequests: 0,
  };
}

export function supplierListingToUpsertPayload(
  listing: SupplierListing,
  opts?: { supplierBusinessId?: string; requiresReview?: boolean },
): Record<string, unknown> {
  return {
    supplier_business_id: opts?.supplierBusinessId || listing.supplierId || null,
    title: listing.name,
    description: listing.description,
    unit: listing.unit,
    moq: listing.moq,
    price_type: priceTypeToDb(listing.priceType),
    fixed_price: listing.fixedPrice ?? null,
    price_min: listing.minPrice ?? null,
    price_max: listing.maxPrice ?? null,
    lead_time: listing.leadTime,
    location: listing.pickupLocation || null,
    category_name: listing.category,
    brand: listing.brand || null,
    sku: listing.sku || null,
    images: listing.images.filter(Boolean),
    listing_status: listingStatusToDb(listing.status),
    requires_review: opts?.requiresReview ?? listing.status === "Pending Review",
    tags: [],
    service_regions: listing.regions
      ? listing.regions.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
  };
}

export type MarketplaceSupplierSummary = {
  id: string;
  business_name: string;
  verification_status: string;
  rating: number | null;
  location: string;
  industry: string;
};

export function dbRowToSupplierSummary(row: MarketplaceProductRow): MarketplaceSupplierSummary {
  return {
    id: row.supplier_business_id || "unknown",
    business_name: row.supplier_name || "Supplier",
    verification_status: row.supplier_verification_status || "unverified",
    rating: row.supplier_rating ?? null,
    location: row.supplier_location || row.supplier_region || "",
    industry: row.industry_group || "",
  };
}
