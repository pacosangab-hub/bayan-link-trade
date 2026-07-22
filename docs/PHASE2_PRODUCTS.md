# Phase 2 — Products / Categories / Pricing / Inventory / Admin Visibility

**Status:** Implemented in code (apply Phase 1 + Phase 2 migrations to Supabase to activate RPCs).  
**Branch:** `cursor/psg-phase2-products-b12a`  
**UI:** No redesign — existing Lovable marketplace, supplier portal, and admin product review screens wired.

## What shipped

### Database (`supabase/migrations/20260722060000_phase2_products_catalog.sql`)

Depends on Phase 1 helpers (`has_admin_role`, `write_audit_log`, permissions).

- Additive product columns: `brand`, `sku`, `review_notes`, `moderated_by`, `moderated_at`
- Child tables: `product_images`, `product_moq_tiers`, `product_inventory`, `product_inventory_movements`, `product_documents`
- Category seed (idempotent by slug)
- RLS on child tables (public read for active listings; supplier/admin write)
- RPCs:
  - `list_marketplace_products` — buyers see active listings only
  - `get_product_detail`
  - `upsert_supplier_product` — supplier create/update (cannot self-approve past review gate)
  - `list_my_supplier_products`
  - `admin_moderate_product` — approve / changes / reject / feature
  - `list_admin_products` — same products table as marketplace
  - `upsert_product_inventory`

### App layer

- `src/validators/products.ts`
- `src/services/products/*` — adapters map DB ↔ existing `Product` / `SupplierListing` shapes
- `src/lib/db.ts` — marketplace prefers Supabase, falls back to mock/localStorage
- Supplier listings / inventory save best-effort to backend; localStorage remains demo offline source
- Admin product review merges local + `list_admin_products` and calls `admin_moderate_product`
- Supplier portal products/inventory merge local + `list_my_supplier_products`

### Tests

- `npm run test` — status/price adapters + product validators

## Apply before using RPCs

1. Apply Phase 1 migration, then Phase 2, on the Lovable Supabase project.
2. Ensure a supplier user has a business membership (`business_members`).
3. Create a product via supplier portal (or RPC) → appears as `pending_review` when review required.
4. Admin with `products.moderate` / admin role approves → marketplace list shows it.
5. Confirm buyer and admin read the **same** `products` row (different filters, not different tables).

## Explicitly out of Phase 2

Cart, checkout, RFQ, payments, delivery tracking, live admin metrics beyond product review.
