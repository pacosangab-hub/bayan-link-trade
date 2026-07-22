# PSG Supply Gateway — Backend Implementation Audit

**Date:** 2026-07-22  
**Branch:** `cursor/psg-backend-audit-b12a`  
**Scope:** Read-only repository audit. No UI redesign. No mock-data removal in this phase.  
**Frontend source of truth:** Existing Lovable routes/components remain unchanged unless a change is strictly required for functionality.

---

## Executive summary

The Lovable frontend is a complete, clickable B2B marketplace UX (buyer, supplier, admin, RFQ, checkout with three delivery methods, messaging, escrow timeline). Almost all business data is **client-side mock + `localStorage`**. Supabase Auth keys are configured and some auth screens call Supabase, but route guards and roles trust a separate `psg_auth_v2` local store. A substantial PostgreSQL schema with RLS already exists in `supabase/migrations/`, and TypeScript types are generated — **the UI does not query those tables**.

**Implication:** Phase work is primarily *wire existing screens to real services*, extend the existing schema (not invent a parallel UI), and make Admin Dashboard read the same source-of-truth tables as buyers/suppliers.

---

## 1. Current frontend architecture

### Stack

| Layer | Choice |
|-------|--------|
| Framework | TanStack Start / Router (`@tanstack/react-start`, file routes under `src/routes/`) |
| UI | React 19, Tailwind 4, shadcn/Radix (`src/components/ui/`), Lucide |
| Data fetching (intended) | TanStack Query wrappers in `src/lib/db.ts` — currently mock-backed |
| Client stores | `useSyncExternalStore` + `localStorage` + custom events |
| Auth client | `@supabase/supabase-js` + `@lovable.dev/cloud-auth-js` (Google OAuth) |
| Styling | `src/styles.css`, theme via `src/lib/theme.tsx` |

### Directory map

```
src/
  routes/                 # File-based pages (62 route modules)
  components/
    admin/                # AdminShell, AdminNotes, DemoSafetyCenter
    auth/                 # RequireAuth, LoginModal
    layout/               # AppShell, NotificationBell, RoleSwitcher
    messages/ offers/ rfq/ search/ ui/
  lib/
    mock-data.ts          # Seed catalog
    cart.ts rfq-store.ts offers-store.ts inventory.ts supplier-listings.ts
    auth-store.ts auth.ts db.ts search.ts
    admin/demo.ts         # Admin DEMO_* catalogs
    demo/                 # messages, notifications, safety, session
  integrations/supabase/  # client, server admin client, auth middleware, types
supabase/migrations/      # 9 SQL migrations (~1.4k LOC), RLS enabled
```

### Nested layouts

| Layout | Path | Guard | Children |
|--------|------|-------|----------|
| `__root.tsx` | `/` | — | All routes |
| `admin.tsx` | `/admin` | `RequireAuth roles=["admin"]` | Admin console pages |
| `supplier-portal.tsx` | `/supplier-portal` | `RequireAuth roles=["supplier","admin"]` | Supplier portal pages |
| `orders.tsx` | `/orders` | `RequireAuth` | Order list/detail |
| `offers.tsx` | `/offers` | `RequireAuth` | Custom offers |
| `custom-requests.tsx` | `/custom-requests` | `RequireAuth` | Supplier custom requests |
| `products.tsx` / `rfq.tsx` | pass-through | none | Catalog / RFQ |

**Note:** `/buyer-portal`, `/checkout`, `/rfq/new` are **not** wrapped in `RequireAuth` at the route file level (some CTAs use login modals).

---

## 2. Existing backend connections

### What is real today

| Capability | Status | Location |
|------------|--------|----------|
| Supabase project env | Configured (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, project id) | `.env` |
| Browser Supabase client | Present | `src/integrations/supabase/client.ts` |
| Server service-role client | Present but **unused**; key **not** in `.env` | `client.server.ts` |
| Auth attach middleware | Registered in `src/start.ts` | `auth-attacher.ts` |
| Server require-auth middleware | Implemented, **never imported** | `auth-middleware.ts` |
| Email/password login/signup | Calls Supabase, then mirrors into `psg_auth_v2` | `login.tsx`, `signup.tsx` |
| Forgot password | `resetPasswordForEmail` | `forgot-password.tsx` |
| Google OAuth | via Lovable cloud auth → `setSession` | `auth.tsx` |
| SQL schema + RLS | Substantial | `supabase/migrations/*` |
| Generated DB types | Present | `src/integrations/supabase/types.ts` |

### What is not connected

- No route/service uses `supabase.from(...)` for marketplace data
- `src/lib/db.ts` reads mock/listings/RFQ store; `useCreateRfq` / `useSubmitRfqQuote` are **no-ops**
- Admin pages read `@/lib/admin/demo` only
- Cart, orders, RFQs, offers, inventory, messages, notifications, safety → `localStorage`
- Checkout totals, escrow fees, delivery fees calculated in the browser

### Existing DB tables (migrations)

`profiles`, `user_roles`, `businesses`, `business_members`, `supplier_profiles`, `categories`, `products`, `rfqs`, `rfq_quotes`, `custom_requests`, `custom_offers`, `custom_offer_versions`, `orders`, `order_items`, `order_events`, `order_proofs`, `escrow_transactions`, `logistics_requests`, `logistics_quotes`, `shipments`, `shipment_events`, `conversations`, `messages`, `notifications`, `reviews`, `attachments`, `verification_documents`, `audit_logs`, `disputes`, `search_logs`, view/RPC helpers (`has_role`, `is_business_member`, `user_business_ids`, `business_contact_info`).

### Critical schema gaps vs target design

| Required (spec) | Current | Notes |
|-----------------|---------|-------|
| `admin_permissions` / `user_admin_permissions` | Missing | Only coarse `app_role` enum: admin/buyer/supplier/carrier/user |
| Granular admin roles (super_admin, finance_admin, …) | Missing | Need extend `app_role` or separate permission tables |
| `buyer_profiles`, `business_addresses` | Missing | Buyer fields live loosely on `businesses` / UI state |
| `carts`, `cart_items`, `checkout_sessions` | Missing | Cart is `psg_cart_v1` |
| `payments`, attempts, refunds, invoices, payouts | Missing | Only `escrow_transactions` + thin `payment_status` on orders |
| `supplier_offers` (normalized RFQ offers) | Partial | `rfq_quotes` exists; UI also has separate custom-offer store |
| Delivery method tables (pickup / carrier / supplier logistics) | Partial | `shipments` + `shipment_events`; UI uses cart `DeliveryDetails` union |
| `shipment_tracking_events` | Alias | Exists as `shipment_events` |
| Product images/prices/MOQ/inventory tables | Partial | Mostly columns on `products`; UI uses `supplier-listings` + `inventory` localStorage |
| Reporting views (`admin_platform_summary`, etc.) | Missing | Admin metrics hardcoded in `MARKETPLACE_SNAPSHOT` |

---

## 3. Mock data inventory

### In-memory seeds (`src/lib/mock-data.ts`)

- `suppliers`, `products`, `rfqs`, `orders`, `conversations`, `categories`, `regions`, `supplierTypes`, `adminQueue`
- Helpers: `formatPhp`, `supplierById`, `productById`, `rfqById`, `orderById`, `escrowSteps`

### `localStorage` business keys (must migrate off)

| Key | Module | Data |
|-----|--------|------|
| `psg_cart_v1` | cart | Cart lines |
| `psg_demo_orders_v1` | cart | Interactive demo orders + stages/proofs |
| `psg_saved_v1` | cart | Wishlist product IDs |
| `psg_rfqs_v1` | rfq-store | RFQ overrides |
| `psg_custom_requests_v1` | offers-store | Custom requests |
| `psg_custom_offers_v1` | offers-store | Custom offers |
| `psg_auth_v2` | auth-store | Client auth user + role |
| `psg.inventory.v1` / `psg.inventory.movements.v1` | inventory | Stock |
| `psg.supplier.listings.v1` | supplier-listings | Supplier products |
| `psg_recent_searches_v1` | search | Recent searches |
| `psg_admin_notes_v1` / `psg_admin_audit_v1` | admin/demo | Notes + fake audit |
| `psg_demo_role_v1` | demo/session | Role switcher |
| `psg_conversations_v2` | demo/messages | Chats |
| `psg_notifications_v1` | demo/notifications | Inbox |
| `psg_safety_reports_v1` | demo/safety | Reports |
| `psg_filters_v1` | products.index | Filter UI state |
| `psg-notification-prefs` | settings | Toggle prefs |

### Harmless UI prefs (may keep)

- `psg-theme` (theme)
- Optionally `psg_filters_v1`, `psg_recent_searches_v1`, `psg-notification-prefs` until preferences move server-side

### Hardcoded dashboard metrics

- Admin: `MARKETPLACE_SNAPSHOT`, `MARKETPLACE_HEALTH`, `RECENT_ACTIVITY`, all `DEMO_*` arrays
- Buyer portal / dashboard: synthetic KPIs and charts
- Supplier portal: `RANGE_DATA`, `PIPELINE`, `REQUEST_METRICS`, `TOP_PRODUCTS`, ratings/reviews fixtures

---

## 4. Route inventory (by surface)

### Public

| Route | Purpose | Current data |
|-------|---------|--------------|
| `/` | Marketing home | mock-data |
| `/products`, `/products/$id` | Marketplace | mock + inventory overlay |
| `/suppliers`, `/suppliers/$id` | Supplier directory/profile | mock |
| `/search` | Global search | mock via `search.ts` |
| `/rfq`, `/rfq/` | RFQ center | mock + rfq-store |
| `/docs` | Internal PRD page | static |
| `/unauthorized` | Access denied | static |

### Auth / onboarding

| Route | Purpose | Backend |
|-------|---------|---------|
| `/login`, `/signup`, `/auth`, `/forgot-password` | Auth | Partial Supabase + demo fallback |
| `/onboarding`, `/onboarding/buyer`, `/onboarding/supplier` | Role/business setup | Local state / auth-store only |

### Account

| Route | Purpose | Backend |
|-------|---------|---------|
| `/account` | Profile, business, addresses, notifications, security | Partial local writes |
| `/settings` | Theme + account prefs | Theme + local prefs |

### Buyer

| Route | Purpose | Backend |
|-------|---------|---------|
| `/buyer-portal`, `/dashboard/buyer` | Buyer KPIs | Demo calc / hardcoded |
| `/checkout` | Cart + 3 delivery methods + escrow | localStorage orders |
| `/orders`, `/orders/$id` | Order list + fulfillment timeline | demo orders + mock seed hydrate |
| `/rfq/new`, `/rfq/$id`, `/rfq/$id/accept` | Create/compare/accept RFQ | rfq-store + demo order |
| `/offers/*` | Custom offers + escrow pay | offers-store |
| `/messages` | Shared inbox | demo/messages |

### Supplier

| Route | Purpose | Backend |
|-------|---------|---------|
| `/supplier-portal/*` | Dashboard, listings, inventory, quote requests, orders, preview, verification, messages stub | Mostly localStorage / fixtures |
| `/custom-requests/*` | Custom request inbox/detail | offers-store |
| `/dashboard/supplier` | Redirect → portal | — |

### Admin (existing pages — connect, do not redesign)

| Route | Purpose | Current data |
|-------|---------|--------------|
| `/admin/` | Overview metrics + queues | Hardcoded snapshot |
| `/admin/buyers` | Users/buyers | `DEMO_BUYERS` |
| `/admin/suppliers` | Suppliers | `DEMO_SUPPLIERS` |
| `/admin/listings`, `/admin/product-review` | Product moderation | DEMO / supplier-listings |
| `/admin/requests` | RFQ/quote oversight | `DEMO_REQUESTS` |
| `/admin/orders` | Order oversight | `DEMO_ORDERS` |
| `/admin/payments` | Escrow/payments | `DEMO_PAYMENTS` |
| `/admin/disputes` | Disputes | `DEMO_DISPUTES` |
| `/admin/verification` | Supplier verification | `DEMO_VERIFICATIONS` |
| `/admin/safety` | Trust & safety | `DEMO_SAFETY` |
| `/admin/users` | Redirect → buyers | — |

---

## 5. Route → table mapping (target)

For each page: data required, actions, roles, tables, admin visibility, realtime.

### Identity & account

| Page | Data required | Actions | Roles | Tables | Admin visibility | Realtime |
|------|---------------|---------|-------|--------|------------------|----------|
| Login/Signup/Auth/Forgot | Session | signIn/signUp/reset/OAuth | public | `auth.users`, `profiles`, `user_roles` | Users section | No |
| Onboarding buyer/supplier | Business draft | create business + membership | authenticated | `businesses`, `business_members`, `buyer_profiles` / `supplier_profiles`, `business_addresses` | Businesses | No |
| Account / Settings | Profile, addresses, prefs | update profile/addresses/prefs | authenticated | `profiles`, `businesses`, `business_addresses`, `notification_preferences` | Users/Businesses | No |

### Marketplace

| Page | Data required | Actions | Roles | Tables | Admin visibility | Realtime |
|------|---------------|---------|-------|--------|------------------|----------|
| Products index/detail | Products, prices, MOQ, inventory, images | view, save, add to cart | public / buyer | `products`, `product_*`, `categories`, `saved_products`, `carts` | Products | No |
| Suppliers index/detail | Business + supplier profile + reviews | view, save supplier | public | `businesses`, `supplier_profiles`, `reviews`, `saved_suppliers` | Businesses | No |
| Search | Products + suppliers | search log | public | products/businesses + `search_logs` | Reports | No |

### Cart / checkout / orders / delivery

| Page | Data required | Actions | Roles | Tables | Admin visibility | Realtime |
|------|---------------|---------|-------|--------|------------------|----------|
| Checkout | Cart, addresses, delivery options, payment methods | create order + payment + shipment | buyer | `carts`, `cart_items`, `checkout_sessions`, `orders`, `order_items`, `order_addresses`, `order_status_history`, `payments`, `shipments` (+ pickup/carrier/supplier detail tables), `notifications` | Orders, Payments, Deliveries | Order status later |
| Orders list/detail | Order, items, escrow, proofs, tracking | advance fulfillment, confirm delivery, dispute, upload proof | buyer/supplier | `orders`, `order_items`, `order_events`/`order_status_history`, `order_proofs`, `escrow_*`/`payments`, `shipments`, `shipment_events`, `disputes` | Orders, Payments, Deliveries, Disputes | Yes (status/tracking) |

### RFQ / offers

| Page | Data required | Actions | Roles | Tables | Admin visibility | Realtime |
|------|---------------|---------|-------|--------|------------------|----------|
| RFQ create/detail/accept | RFQ items, attachments, quotes | draft/publish/close/accept | buyer | `rfqs`, `rfq_items`, `rfq_attachments`, `rfq_invited_suppliers`, `rfq_quotes`/`supplier_offers*`, `orders` | RFQs, Offers, Orders | Yes (new offers) |
| Supplier quote-requests | Eligible RFQs | submit/revise quote | supplier | same | RFQs, Offers | Yes |
| Custom requests/offers | Request/offer versions | create/revise/accept/reject | buyer/supplier | `custom_requests`, `custom_offers`, `custom_offer_versions`, `orders` | Requests/Offers, Orders | Yes |

### Messaging / notifications

| Page | Data required | Actions | Roles | Tables | Admin visibility | Realtime |
|------|---------------|---------|-------|--------|------------------|----------|
| Messages | Conversations, messages, cards | send, attach request/offer | authenticated | `conversations`, `messages`, attachments | Messages (permissioned + reason) | Yes |
| NotificationBell | Notifications | mark read | authenticated | `notifications` | Admin notification queues | Yes |

### Supplier portal

| Page | Data required | Actions | Roles | Tables | Admin visibility | Realtime |
|------|---------------|---------|-------|--------|------------------|----------|
| Dashboard | Sales/orders/RFQ metrics | — | supplier | orders, offers, products (aggregates) | Overview + supplier detail | Optional |
| Products / new | Listings | create/update/status | supplier | `products`, images, prices, MOQ | Products moderation | No |
| Inventory | Stock/movements | adjust stock | supplier | `product_inventory` (+ movements) | Products | No |
| Orders | Supplier orders | fulfill | supplier | orders/shipments | Orders/Deliveries | Yes |
| Verification | Docs/status | upload docs | supplier | `verification_documents`, submissions | Verification | No |
| Preview | Public profile | — | supplier | businesses/supplier_profiles/products | Businesses | No |

### Admin (same tables — no shadow copies)

| Page | Reads | Mutations (permission + audit) | Permissions |
|------|-------|--------------------------------|-------------|
| Overview | reporting views/functions | — | `reports.read` |
| Buyers/Users | profiles, roles, businesses, order aggregates | suspend/reactivate, notes | `users.read` / `users.manage` |
| Suppliers/Businesses | businesses, supplier_profiles, verification | verify/reject/resubmit | `businesses.read` / `businesses.verify` |
| Listings / Product review | products | approve/reject/hide | `products.read` / `products.moderate` |
| Requests | rfqs + custom_requests | notes, limited manage | `rfqs.read` / `rfqs.manage` |
| Orders | orders + related | freeze/cancel/note/release (restricted) | `orders.read` / `orders.manage` |
| Payments | payments/escrow/refunds | release/refund (finance) | `payments.read` / `payments.manage` |
| Disputes | disputes + evidence | resolve/assign | `disputes.*` |
| Verification | verification submissions/docs | approve/reject | `businesses.verify` |
| Safety | reports | warn/suspend/dismiss | `reports.*` / `users.manage` |
| Audit (via notes panel / future page) | `audit_logs` | immutable insert-only | `audit_logs.read` |

---

## 6. Admin visibility matrix

| User-facing event | Tables written | Admin surfaces that must show it |
|-------------------|----------------|----------------------------------|
| Buyer/supplier signup | `profiles`, `user_roles`, business + membership | Users, Overview (signups) |
| Supplier verification submit | verification tables | Verification queue, Suppliers |
| Product create/update | products (+ related) | Products, Product review, Overview |
| Cart → checkout order | orders, items, addresses, payments, shipments | Orders, Payments, Deliveries, Overview GMV |
| Tracking event | `shipment_events` | Deliveries detail timeline |
| RFQ publish | rfqs, items, invitations | RFQs, Overview |
| Offer/quote submit/revise | quotes/offers + history | Offers, RFQ detail |
| Accept offer → order | order + status history + RFQ conversion | RFQs, Offers, Orders |
| Dispute open | disputes, evidence | Disputes, Orders |
| Admin decision | `audit_logs`, entity status | Audit log + entity detail |
| Message report | reports (+ optional conversation access log) | Safety, Messages (gated) |

**Rule:** Admin never reads a separate `DEMO_*` copy. Same Postgres rows, permission-aware policies or SECURITY DEFINER RPCs.

---

## 7. Non-functional / stub UI (keep UI; wire later)

| Location | Stub behavior |
|----------|---------------|
| Most admin action buttons | Toast + local `addAudit`; do not mutate DEMO arrays |
| Admin buyers “View Orders / Message” | No handlers |
| Account address/security/2FA/delete | No handlers |
| Settings “Logout device”, “Edit Profile” | Toast / no-op |
| Messages file attach | Demo placeholder toast |
| Product “Product video” | Coming soon toast |
| Checkout COD | Disabled by design |
| `db.useCreateRfq` / `useSubmitRfqQuote` | Explicit no-ops |
| Buyer dashboard “Reorder” | No handler |
| Onboarding forms | Complete locally without DB business row |

---

## 8. Existing TypeScript interfaces (frontend)

| Domain | Primary types | Source |
|--------|---------------|--------|
| Auth | `AuthUser`, `AuthRole` | `auth-store.ts` |
| Catalog | `Product`, `Supplier`, `SupplierListing` | mock-data / supplier-listings |
| Cart/Order/Delivery | `CartItem`, `DemoOrder`, `DeliveryDetails`, `DeliveryMethodKey`, `Proof`, `StageKey` | cart.ts |
| RFQ | `RFQ`, `RFQStatus` | mock-data / rfq-store |
| Custom offers | `CustomRequest`, `CustomOffer`, `OfferVersion` | offers-store |
| Inventory | `InventoryRecord`, `Movement` | inventory.ts |
| Admin demo | `DemoBuyer`, `DemoSupplier`, `DemoOrder`, `DemoPayment`, … | admin/demo.ts |
| Messaging | `Conversation`, `ChatMessage` | demo/messages.ts |
| DB | Generated `Database` | integrations/supabase/types.ts |

Service-layer DTOs should map UI shapes ↔ DB rows without forcing component redesign (adapters in `services/` / `repositories/`).

---

## 9. Proposed migration plan

### Principle

1. **Reuse** existing migrations where shapes align (`profiles`, `user_roles`, `businesses`, `products`, `rfqs`, `rfq_quotes`, `orders`, `shipments`, `shipment_events`, `audit_logs`, `disputes`, …).
2. **Additive migrations** for missing domains (admin permissions, carts, payments provider model, delivery detail tables, reporting views).
3. **Do not drop** existing tables until UI is fully switched and dual-read is unnecessary.
4. Map UI vocabulary → DB:
   - Custom offers UI → `custom_requests` / `custom_offers`
   - RFQ quotes UI → `rfq_quotes` (extend toward `supplier_offers` model if needed)
   - Tracking timeline UI → `shipment_events` (seed LBC demo rows)
   - Escrow UI → evolve `escrow_transactions` + new `payments` abstraction

### Phased migrations (aligned to implementation order)

| Phase | Migration focus |
|-------|-----------------|
| **1** | Extend roles/permissions (`admin_permissions`, `user_admin_permissions`, admin role enums); harden `handle_new_user` (never assign admin from client metadata); `buyer_profiles`; `business_addresses`; account status fields; fix RLS EXECUTE grants for `has_role` if broken |
| **2** | Product normalization (images, prices, MOQ tiers, inventory, delivery options, moderation status); storage buckets |
| **3** | `carts` / `cart_items` / `checkout_sessions`; order creation RPCs; `order_status_history` alignment with UI stages |
| **4** | Delivery method detail tables + seed tracking for LBC-842973641; shipment status sync triggers |
| **5** | RFQ items/attachments/invites; offer revisions/history; accept-offer transactional RPC |
| **6** | Provider-neutral `payments`, attempts, webhooks, refunds, invoices, commissions |
| **7** | Messaging/notifications prefs; reviews; saved products/suppliers |
| **8** | Verification submissions; moderation_actions; disputes evidence/messages; immutable audit hardening |
| **9** | Admin reporting views/functions + indexes |
| **10** | Seeds, RLS tests, E2E, remove localStorage business keys |

---

## 10. Security risks (current)

| Risk | Severity | Detail |
|------|----------|--------|
| Client-side admin gate | **Critical** | `RequireAuth` trusts `psg_auth_v2`; demo “Continue as Admin” / localStorage role edit |
| Client-chosen roles at signup | **Critical** | `user_metadata.role` written from client; login trusts it; DB `user_roles` ignored by UI |
| Dual auth sessions | High | `/auth` OAuth may set Supabase session without `setAuthUser`; demo login may set store without JWT |
| Client-trusted money | High | Checkout/offer/admin fee math in browser |
| Admin actions cosmetic | High | No server enforcement for suspend/release/refund |
| Signup continues on Supabase failure | Medium | Falls back to demo session |
| RLS helper EXECUTE revokes | Medium | Later migrations revoke `has_role` EXECUTE from `authenticated` — validate live policies still work |
| Service role | OK currently | Not in frontend env; unused server client — keep it that way for browser |
| Private message browsing | Design risk | Admin safety UI must require permission + access reason (not built) |

---

## 11. Phase 1 implementation plan

**Goal:** Secure identity foundation the rest of the stack can trust. **No UI redesign.**

### 1.1 Inspect / align

- Keep screens: `/login`, `/signup`, `/auth`, `/forgot-password`, `/onboarding/*`, `/account`, `/unauthorized`, `RequireAuth`, `AppShell` account menu
- Replace internals of `auth-store` to mirror Supabase session + DB `profiles` / `user_roles` (same hook signatures where possible)

### 1.2 Database changes (new migration)

1. Extend role model:
   - Keep/extend `app_role` for `buyer`, `supplier`, `admin`, `super_admin`, `support`, `finance_admin`, `verification_admin`, `operations_admin` (migrate away from trusting `user` metadata)
2. Create `admin_permissions` seed catalog + `user_admin_permissions`
3. Add `buyer_profiles`, `business_addresses`
4. Add profile/account fields needed by Account UI (`phone`, `account_status`, `last_sign_in_at` sync strategy)
5. Replace/harden `handle_new_user`:
   - Create `profiles` row
   - Assign default non-admin role only (e.g. pending role selection → buyer/supplier via onboarding RPC)
   - **Ignore** client `user_metadata.role` for privilege elevation
6. RPC helpers (SECURITY DEFINER, locked down):
   - `get_my_profile()`
   - `complete_buyer_onboarding(...)`
   - `complete_supplier_onboarding(...)`
   - `admin_set_user_roles(...)` / `admin_set_permissions(...)` with audit log
7. Ensure `has_role` / permission checks are executable by policies that need them
8. RLS: users cannot insert/update `user_roles` or admin permissions; admins gated by permissions

### 1.3 Services (new code, no redesign)

```
src/services/auth/
src/services/profiles/
src/services/businesses/
src/services/admin/permissions.ts
src/repositories/...
src/validators/...
```

Functions: `signIn`, `signUp`, `signOut`, `requestPasswordReset`, `getSessionProfile`, `createBusiness`, `completeOnboarding`, `listMyBusinesses`, `writeAuditLog`.

### 1.4 Wire UI (minimal)

- Login/signup: stop writing arbitrary admin roles to local store; load roles from DB after session
- Remove/disable demo admin elevation in production builds (keep optional `import.meta.env.DEV` demo only if product still needs it — default off for staging/prod)
- `RequireAuth`: still client UX gate, but **server RPCs/RLS** are authority
- Onboarding forms: persist businesses/members/profiles
- Account: persist profile + addresses
- Admin shell access: require DB admin role + at least one permission; Overview can stay fixture until Phase 9 but gate must be real

### 1.5 Seed (dev)

- 1 buyer, 1 supplier, 1 super_admin (+ optional finance/verification admins)
- Buyer + supplier businesses and memberships
- Permission grants for super_admin = all

### 1.6 Tests (Phase 1 minimum)

- User cannot self-assign admin via signup metadata
- Non-admin cannot SELECT others’ private profile fields beyond policy
- Onboarding creates business + membership
- `RequireAuth` alone is insufficient — RPC denies unauthorized admin permission changes
- Audit log written on admin permission change

### 1.7 Exit criteria for Phase 1

- [ ] Migration applies clean on empty DB
- [ ] Types regenerated
- [ ] Auth session ↔ profile/roles consistent
- [ ] Onboarding persists
- [ ] Admin route blocked without DB admin role
- [ ] No service role in Vite env
- [ ] Lint / typecheck / unit tests pass
- [ ] UI appearance unchanged

**Explicitly out of Phase 1:** products, cart, checkout, RFQ, payments, delivery tracking, admin live metrics (Overview may remain placeholder numbers until Phase 9, but access control must be real).

---

## 12. Recommended immediate next step

After review/approval of this audit:

1. Implement Phase 1 migration + auth/profile/business services.
2. Wire login/signup/onboarding/account/RequireAuth without visual changes.
3. Add seed + tests.
4. Only then proceed to Phase 2 (products).

---

## Appendix A — Component touchpoints (do not replace)

Key existing components to keep and connect:

- `AppShell`, `RoleSwitcher`, `NotificationBell`
- `RequireAuth`, `LoginModal`
- `AdminShell`, `AdminNotes`
- Product/RFQ/Offer/Message cards under `src/components/**`
- Checkout delivery method UI in `src/routes/checkout.tsx`
- Order timeline UI in `src/routes/orders.$id.tsx`

## Appendix B — Service architecture target

```
src/
  lib/supabase/          # thin clients (migrate from integrations/)
  services/              # use-cases, validation, authz checks
  repositories/          # Supabase queries
  hooks/                 # React Query hooks for pages
  types/                 # shared DTOs
  validators/            # Zod schemas
```

Pages call hooks/services only — no business rules or permission decisions invented in JSX.
