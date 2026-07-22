import { supabase } from "@/integrations/supabase/client";
import {
  dbRowToProduct,
  dbRowToSupplierListing,
  dbRowToSupplierSummary,
  listingStatusToDb,
  priceTypeToDb,
  supplierListingToUpsertPayload,
  type MarketplaceProductRow,
} from "@/services/products/adapters";
import type { Product } from "@/lib/mock-data";
import type { ListingStatus, SupplierListing } from "@/lib/supplier-listings";
import { moderateProductSchema, productUpsertSchema, type ProductUpsertInput } from "@/validators/products";

function asRows(data: unknown): MarketplaceProductRow[] {
  if (!Array.isArray(data)) return [];
  return data.filter((row): row is MarketplaceProductRow => !!row && typeof row === "object");
}

export async function listMarketplaceProducts(opts?: {
  search?: string;
  categorySlug?: string;
}): Promise<Array<{ product: Product; supplier: ReturnType<typeof dbRowToSupplierSummary> }>> {
  const { data, error } = await supabase.rpc("list_marketplace_products" as never, {
    _search: opts?.search ?? null,
    _category_slug: opts?.categorySlug ?? null,
    _limit: 100,
    _offset: 0,
  } as never);
  if (error) throw error;
  return asRows(data).map((row) => ({
    product: dbRowToProduct(row),
    supplier: dbRowToSupplierSummary(row),
  }));
}

export async function getProductDetail(productId: string): Promise<{
  product: Product;
  supplier: ReturnType<typeof dbRowToSupplierSummary>;
  raw: MarketplaceProductRow;
} | null> {
  const { data, error } = await supabase.rpc("get_product_detail" as never, {
    _product_id: productId,
  } as never);
  if (error) throw error;
  if (!data || typeof data !== "object") return null;
  const row = data as MarketplaceProductRow;
  return {
    product: dbRowToProduct(row),
    supplier: dbRowToSupplierSummary(row),
    raw: row,
  };
}

export async function listMySupplierProducts(): Promise<SupplierListing[]> {
  const { data, error } = await supabase.rpc("list_my_supplier_products" as never);
  if (error) throw error;
  return asRows(data).map(dbRowToSupplierListing);
}

export async function listAdminProducts(listingStatus?: string): Promise<SupplierListing[]> {
  const { data, error } = await supabase.rpc("list_admin_products" as never, {
    _listing_status: listingStatus ?? null,
  } as never);
  if (error) throw error;
  return asRows(data).map(dbRowToSupplierListing);
}

export async function upsertSupplierProduct(
  input: ProductUpsertInput,
  productId?: string,
): Promise<string> {
  const parsed = productUpsertSchema.parse(input);
  const payload = {
    title: parsed.title,
    description: parsed.description ?? null,
    unit: parsed.unit,
    moq: parsed.moq,
    price_type: priceTypeToDb(parsed.priceType),
    fixed_price: parsed.fixedPrice ?? null,
    price_min: parsed.minPrice ?? null,
    price_max: parsed.maxPrice ?? null,
    lead_time: parsed.leadTime ?? null,
    location: parsed.location ?? null,
    category_name: parsed.categoryName ?? null,
    brand: parsed.brand ?? null,
    sku: parsed.sku ?? null,
    images: parsed.images,
    listing_status: listingStatusToDb(parsed.listingStatus),
    requires_review: parsed.requiresReview ?? parsed.listingStatus === "Pending Review",
    supplier_business_id: parsed.supplierBusinessId ?? null,
    tier_pricing: parsed.tierPricing ?? [],
  };
  const { data, error } = await supabase.rpc("upsert_supplier_product" as never, {
    _payload: payload,
    _product_id: productId ?? null,
  } as never);
  if (error) throw error;
  return String(data);
}

export async function saveListingToBackend(listing: SupplierListing): Promise<string | null> {
  try {
    const payload = supplierListingToUpsertPayload(listing, {
      requiresReview: listing.status === "Pending Review",
    });
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      listing.id,
    );
    const { data, error } = await supabase.rpc("upsert_supplier_product" as never, {
      _payload: payload,
      _product_id: isUuid ? listing.id : null,
    } as never);
    if (error) throw error;
    return String(data);
  } catch {
    return null;
  }
}

export async function moderateProduct(input: {
  productId: string;
  listingStatus: ListingStatus;
  reviewNotes?: string;
  isFeatured?: boolean;
}): Promise<void> {
  const parsed = moderateProductSchema.parse({
    productId: input.productId,
    listingStatus: listingStatusToDb(input.listingStatus),
    reviewNotes: input.reviewNotes,
    isFeatured: input.isFeatured,
  });
  const { error } = await supabase.rpc("admin_moderate_product" as never, {
    _product_id: parsed.productId,
    _listing_status: parsed.listingStatus,
    _review_notes: parsed.reviewNotes ?? null,
    _compliance_status: parsed.complianceStatus ?? null,
    _is_featured: parsed.isFeatured ?? null,
  } as never);
  if (error) throw error;
}

export async function upsertProductInventory(input: {
  productId: string;
  available?: number;
  reserved?: number;
  incoming?: number;
  lowStockThreshold?: number;
  trackingType?: string;
  paused?: boolean;
  restockDate?: string | null;
  leadTime?: string | null;
  note?: string;
}): Promise<string | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    input.productId,
  );
  if (!isUuid) return null;
  try {
    const { data, error } = await supabase.rpc("upsert_product_inventory" as never, {
      _product_id: input.productId,
      _available: input.available ?? null,
      _reserved: input.reserved ?? null,
      _incoming: input.incoming ?? null,
      _low_stock_threshold: input.lowStockThreshold ?? null,
      _tracking_type: input.trackingType ?? null,
      _paused: input.paused ?? null,
      _restock_date: input.restockDate ?? null,
      _lead_time: input.leadTime ?? null,
      _note: input.note ?? null,
    } as never);
    if (error) throw error;
    return String(data);
  } catch {
    return null;
  }
}

export async function listCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,icon,industry_group,sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
