
# PSG Live Backend Migration Plan

Goal: replace every mock array, localStorage store, and demo helper with real Supabase-backed data + realtime, without redesigning the UI. Rolled out in 5 phases so each is shippable and verifiable.

## Guiding rules
- Keep the existing schema (`businesses`, `products`, `rfqs`, `rfq_quotes`, `custom_offers`, `orders`, `messages`, `conversations`, `notifications`, `disputes`, `shipments`, etc.) and extend it. No table renames.
- Every new/changed table gets `GRANT` + `ENABLE RLS` + owner/admin policies in the same migration.
- All server writes go through `createServerFn` w/ `requireSupabaseAuth`; all client reads use `@/integrations/supabase/client` + TanStack Query.
- Realtime: enable `supabase_realtime` publication on tables the UI subscribes to; wrap channel subscriptions in `useEffect` with cleanup.
- First user to sign up becomes `super_admin` (trigger); subsequent admins promoted from Admin Console.
- Mock data (150+ products, 60+ suppliers) is imported as real rows owned by a seed "PSG Demo Supplier" account so the marketplace isn't empty.

## Phase 1 — Auth, Roles, RLS foundation
- Extend `app_role` enum to include `super_admin`, `admin`, `supplier`, `buyer` (keep `user` alias for back-compat).
- Update `handle_new_user` trigger: if `user_roles` is empty, assign `super_admin`; else assign default `buyer`.
- Add missing tables: `activity_logs`, `payments`, `deliveries` (thin wrapper over shipments), `tracking_events` (alias view of `shipment_events`), `product_images` (extract from `products.images` jsonb), `dashboard_metrics` (materialized snapshot refreshed by trigger/cron), `admin_settings`, `buyer_profiles`, `verification_requests` (unify with `verification_documents`).
- RLS policies for every new table.
- Rewrite `src/lib/auth-store.ts` + `auth-sync.ts` to derive role from `user_roles` (via `has_role` RPC) instead of user_metadata. Remove localStorage role.
- Protected routes: `<RequireAuth>` reads live session + role; email verification gate on sensitive actions.
- Forgot password + `/reset-password` page.

## Phase 2 — Products, Suppliers, Categories, Search
- Migrate `src/lib/mock-data.ts` (suppliers, products, categories) into DB via a seed migration owned by a `demo@psg.local` supplier account.
- Replace `src/lib/db.ts`, `src/lib/supplier-listings.ts`, `src/lib/inventory.ts` with real Supabase queries + TanStack Query hooks.
- Product images: move to `product-images` bucket + `product_images` table with signed URLs.
- Supplier Portal (`/supplier-portal/*`): products CRUD, inventory adjustments, image uploads, public preview — all live.
- Marketplace (`/products`, `/suppliers`, `/search`): server-side filtering (category, region, MOQ, verified, escrow, OEM, private label) via `.textSearch()` + filters, pagination + infinite scroll, log queries to `search_logs`.

## Phase 3 — RFQs, Quotations, Offers, Orders, Cart, Checkout
- Replace `rfq-store.ts`, `offers-store.ts`, `cart.ts` (localStorage) with Supabase-backed hooks.
- RFQ flow: create → suppliers see in `/supplier-portal/quote-requests` → submit `rfq_quotes` → buyer compares at `/rfq/$id` → accept creates `orders` + `order_items` in a server function.
- Custom offers via chat: `custom_offers` + `custom_offer_versions` wired to messages.
- Checkout (`/checkout`, `/offers/$id/checkout`): writes `orders`, `order_items`, `deliveries`, `payments` (status=`pending`, demo escrow). Delivery method selection persisted; tracking timeline reads `shipment_events`.
- Reviews after `orders.status='completed'`.

## Phase 4 — Messaging, Notifications, Realtime, Admin Console
- Messaging: `/messages` reads `conversations` + `messages`; subscribe via Realtime channel per conversation; attachments to `message-attachments` bucket with path-scoped RLS.
- Notifications: `notifications` table + realtime subscription in `NotificationBell`; unread count live; server triggers insert notifications on RFQ/quote/order/payment/verification/message events.
- Admin Console (`/admin/*`): every metric card, table, and chart pulls from live queries. Dashboard KPIs computed via SQL views (`admin_kpis_v`) and subscribed to via realtime on underlying tables. Verification queue, disputes, buyers, suppliers, orders, payments, listings — all live with row actions writing back through server fns.
- Enable publication:
```
alter publication supabase_realtime add table products, rfqs, rfq_quotes, custom_offers, orders, messages, notifications, shipments, shipment_events, verification_documents;
```

## Phase 5 — Storage, Analytics, Activity Logs, Polish
- Storage buckets already exist (verified). Add upload UIs where missing (logos, certificates, FDA/ISO permits, delivery proof).
- Activity logs: server fn `logActivity()` called from every mutating server fn; `/admin/activity` viewer.
- Analytics: SQL views for GMV, order counts, supplier/buyer growth, top products/suppliers/categories; charts subscribe via realtime invalidation.
- Performance: add indexes on FK + filter columns, `defaultPreloadStaleTime: 0` already set, pagination on all lists, optimistic mutations for cart/inventory.
- Remove `src/lib/mock-data.ts`, `demo/*`, localStorage stores. Add error boundaries + empty states on every list route.

## Technical notes
- Server fns live in `src/lib/*.functions.ts`; `supabaseAdmin` used only inside handlers after role check.
- `src/start.ts` must have `attachSupabaseAuth` in `functionMiddleware` (verify).
- Public read paths (landing product cards) use server publishable client + narrow `TO anon` SELECT policies on `products` (only `listing_status='active'`) and `businesses` (safe columns only — already enforced).
- No `service_role` key ever in client bundle; `client.server.ts` imports stay dynamic inside handlers.
- Types regenerated after each migration; UI updates follow in same phase.

## Deliverable for this approval
Approving this plan authorizes me to start **Phase 1** in the next turn (auth + roles + RLS foundation + reset-password + role-driven guards + activity_logs/dashboard_metrics/admin_settings tables). Phases 2–5 will each be proposed and shipped as their own turn so you can review and course-correct between them.
