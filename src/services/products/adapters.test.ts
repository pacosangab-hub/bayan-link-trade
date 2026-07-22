import { describe, expect, it } from "vitest";
import {
  dbRowToProduct,
  dbRowToSupplierListing,
  listingStatusToDb,
  listingStatusToUi,
  priceTypeToDb,
  priceTypeToUi,
} from "./adapters";
import { moderateProductSchema, productUpsertSchema } from "@/validators/products";

describe("listing status mapping", () => {
  it("maps UI statuses to DB snake_case", () => {
    expect(listingStatusToDb("Pending Review")).toBe("pending_review");
    expect(listingStatusToDb("Needs Changes")).toBe("needs_changes");
    expect(listingStatusToUi("pending_review")).toBe("Pending Review");
  });
});

describe("price type mapping", () => {
  it("maps quote UI to quote_only DB", () => {
    expect(priceTypeToDb("quote")).toBe("quote_only");
    expect(priceTypeToUi("quote_only")).toBe("quote");
    expect(priceTypeToUi("fixed")).toBe("fixed");
  });
});

describe("dbRowToProduct", () => {
  it("adapts marketplace row into Product shape", () => {
    const product = dbRowToProduct({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Rice 50kg",
      supplier_business_id: "22222222-2222-4222-8222-222222222222",
      category_name: "Rice & Grains",
      industry_group: "Agriculture",
      unit: "sack",
      moq: 20,
      fixed_price: 2450,
      price_type: "fixed",
      images: ["https://example.com/rice.jpg"],
      lead_time: "2–3 business days",
      listing_status: "active",
      tier_pricing: [{ qty: 50, price: 2300 }],
      inventory_available: 100,
      inventory_tracking_type: "tracked",
    });
    expect(product.title).toBe("Rice 50kg");
    expect(product.pricePhp).toBe(2450);
    expect(product.tierPricing[0]).toEqual({ qty: 50, price: 2300 });
    expect(product.stock).toBe("In stock");
  });
});

describe("dbRowToSupplierListing", () => {
  it("adapts row into SupplierListing shape", () => {
    const listing = dbRowToSupplierListing({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Kraft Boxes",
      description: "Food grade",
      supplier_business_id: "22222222-2222-4222-8222-222222222222",
      supplier_name: "Pack Co",
      category_name: "Packaging",
      industry_group: "Packaging Materials",
      unit: "carton",
      moq: 10,
      fixed_price: 1180,
      price_type: "fixed",
      images: ["https://example.com/box.jpg"],
      lead_time: "3 days",
      listing_status: "pending_review",
      stock_status: "in_stock",
      created_at: "2026-07-01T00:00:00Z",
      updated_at: "2026-07-02T00:00:00Z",
    });
    expect(listing.name).toBe("Kraft Boxes");
    expect(listing.status).toBe("Pending Review");
    expect(listing.priceType).toBe("fixed");
  });
});

describe("product validators", () => {
  it("accepts valid upsert payload", () => {
    const parsed = productUpsertSchema.parse({
      title: "Cement",
      unit: "bag",
      moq: 50,
      priceType: "fixed",
      fixedPrice: 260,
      images: ["https://example.com/c.jpg"],
      listingStatus: "Draft",
    });
    expect(parsed.title).toBe("Cement");
  });

  it("rejects empty title", () => {
    expect(() =>
      productUpsertSchema.parse({
        title: " ",
        unit: "bag",
        moq: 1,
        priceType: "fixed",
        images: [],
        listingStatus: "Draft",
      }),
    ).toThrow();
  });

  it("accepts moderate payload with snake_case status", () => {
    const parsed = moderateProductSchema.parse({
      productId: "11111111-1111-4111-8111-111111111111",
      listingStatus: "active",
      isFeatured: true,
    });
    expect(parsed.isFeatured).toBe(true);
  });
});
