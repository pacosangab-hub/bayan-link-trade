import { z } from "zod";

export const productUpsertSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  unit: z.string().trim().min(1).max(40),
  moq: z.number().int().min(1).max(1_000_000),
  priceType: z.enum(["fixed", "range", "quote"]),
  fixedPrice: z.number().min(0).optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
  leadTime: z.string().trim().max(80).optional(),
  location: z.string().trim().max(200).optional(),
  categoryName: z.string().trim().max(120).optional(),
  brand: z.string().trim().max(120).optional(),
  sku: z.string().trim().max(80).optional(),
  images: z.array(z.string().url().or(z.string().min(1))).max(12),
  listingStatus: z.enum([
    "Draft",
    "Pending Review",
    "Active",
    "Needs Changes",
    "Rejected",
    "Paused",
    "Archived",
  ]),
  supplierBusinessId: z.string().uuid().optional(),
  requiresReview: z.boolean().optional(),
  tierPricing: z
    .array(z.object({ qty: z.number().int().min(1), price: z.number().min(0) }))
    .optional(),
});

export const moderateProductSchema = z.object({
  productId: z.string().uuid(),
  listingStatus: z.enum([
    "draft",
    "pending_review",
    "active",
    "needs_changes",
    "rejected",
    "paused",
    "archived",
  ]),
  reviewNotes: z.string().trim().max(2000).optional(),
  complianceStatus: z
    .enum([
      "no_review_needed",
      "docs_required",
      "pending_review",
      "approved",
      "rejected",
      "restricted",
    ])
    .optional(),
  isFeatured: z.boolean().optional(),
});

export type ProductUpsertInput = z.infer<typeof productUpsertSchema>;
export type ModerateProductInput = z.infer<typeof moderateProductSchema>;
