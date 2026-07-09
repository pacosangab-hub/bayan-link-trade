# PSG Demo — Full MVP Wire-Up (localStorage only)

Rip out all broken backend calls. Ship a stable, clickable demo where Messages is the center of gravity: chat → custom request → custom offer → order → escrow → completion, with notifications updating throughout.

## Scope

Frontend-only. No Supabase, no server functions, no API keys. All state lives in `localStorage` behind a small set of stores. Existing `offers-store.ts` / `rfq-store.ts` / `cart.ts` become the pattern for everything else.

## 1. Demo state layer (`src/lib/demo/`)

Central persistence + pub-sub so every screen updates live.

- `store.ts` — tiny `createStore<T>(key, seed)` helper: `get`, `set`, `update`, `subscribe`, `useStore()` hook. Wraps `localStorage` with JSON + versioning. One `resetAll()` export.
- `session.ts` — active demo role: `buyer | supplier | admin`. Hook `useDemoRole()`. Header dropdown ("View as Buyer/Supplier/Admin") writes here.
- `messages-store.ts` — conversations + messages. Message kinds: `text | custom_request | custom_offer | order_created | system`. Sending a message updates `lastMessage`, `updatedAt`, unread counter for the other side, and pushes a notification.
- `orders-store.ts` — orders + timeline events + escrow state machine. Actions: `createFromOffer`, `fundEscrow`, `markPreparing`, `markReady`, `markInTransit`, `markDelivered`, `confirmDelivery` (releases escrow), `openDispute`, `resolveDispute`, `refund`. Each transition appends a timeline entry and fires notifications.
- `notifications-store.ts` — per-role inbox. `push({role, title, body, href, kind})`, `markRead`, `markAllRead`, `unreadCount(role)`. Bell subscribes.
- `safety-store.ts` — reports + off-platform keyword list + restricted categories.
- `seed.ts` — bootstraps rich demo data on first load (conversations with sample custom request + offer cards mid-thread, 3 orders in different states, notifications, reports). `resetDemoData()` re-runs seed.

`offers-store.ts` / `rfq-store.ts` / `cart.ts` are refactored to use `createStore` so everything shares one pattern.

## 2. Messages (`/messages`)

Rewrite `src/routes/messages.tsx` + new components under `src/components/messages/`.

- Left: conversation list from store, unread badge, search filter, "Report" link on active chat header.
- Right: header (supplier/buyer name, verification badge, "View profile", "Report"), safety banner ("Never pay outside PSG escrow…"), message list rendering per-kind:
  - `text` → bubble
  - `custom_request` → `CustomRequestCard` (buyer-side actions: Edit/Cancel; supplier-side: Send Custom Offer / Ask Follow-up / Decline)
  - `custom_offer` → `CustomOfferCard` (buyer: Accept / Request Changes / Reject / Message; supplier: Revise / Withdraw)
  - `order_created` → `OrderCreatedCard` (View Order → `/orders/$id`)
- Composer: textarea + Send + paperclip. Paperclip opens `AttachmentMenu` whose contents depend on `useDemoRole()`:
  - Buyer: Send Custom Request, Attach Product, Attach Order, Upload File (placeholder)
  - Supplier: Send Custom Offer, Attach Product, Attach Quote, Upload File
- Off-platform keyword check on Send → `OffPlatformWarningModal` ("Continue sending?"). Continue still sends but flags message.
- Accepting an offer in-chat → confirm modal → `ordersStore.createFromOffer(offer)` → posts `order_created` card in the same thread → navigate to `/orders/$id` (buyer choice via toast action).

Reuse/extend existing `RequestCustomQuoteModal` and `SendCustomOfferModal` — swap their submit handlers to write into `messages-store` (post as message kind) instead of the separate offers list. `offers.index.tsx` reads from the same store so /offers stays a mirror view.

## 3. Orders

- `/orders` (`orders.tsx`): read from store, View → `/orders/$id`.
- `/orders/$id` (`orders.$id.tsx` — rewrite): full detail page with buyer/supplier panels, items table, delivery info, escrow panel, timeline, "Open conversation" link back to Messages.
- Role-scoped action bar (driven by `useDemoRole()`):
  - Buyer: Pay with Demo Escrow, Message Supplier, Report Problem, Confirm Delivery, Request Refund
  - Supplier: Confirm Order, Mark Preparing, Mark Ready, Mark In Transit, Mark Delivered, Request Escrow Release
  - Admin: Freeze Escrow, Release, Refund, Partial Refund, Resolve Dispute, Suspend Supplier
- Each button calls the corresponding `ordersStore` action → status/escrow update → timeline entry → notifications for the counterparty.
- `ReportProblemModal` (reasons + evidence placeholder) → sets dispute, freezes escrow, notifies admin + supplier.

## 4. Notifications

- `NotificationBell` in `AppShell` header: unread badge from `notifications-store` scoped by current role.
- Dropdown: list with icon per kind, title/body/time, click → `href`, per-item Mark read, "Mark all read".
- All store actions above push here so counts update live.

## 5. Safety

- Persistent safety banner in Messages (already partly there — strengthen copy).
- Off-platform keyword warning modal.
- Report modal reachable from Messages header and Order detail; writes to `safety-store`.
- Verified badge component reused on: supplier cards, product cards, message header, offer cards, order detail.
- Restricted-category banner on product detail for high-risk categories (pharma, chemicals, mining, cosmetics, food manufacturing, medical).
- Explosives/blasting items rendered with "Restricted — Admin Approval Required" and disabled checkout.
- Attachment placeholder note: "Files are scanned and logged for safety in the real version."
- New route `/admin/safety` (`admin.safety.tsx`): tabs for reported conversations, disputed orders, unverified suppliers, off-platform flags, suspended accounts, with admin actions wired to stores.

## 6. Product catalog expansion

- Rewrite `src/lib/mock-data.ts` (or add `src/lib/demo/catalog.ts`) with 90+ products across the 20 industries listed, each with: name, category, industry, supplier, price/range, unit, MOQ, location, rating, verification, lead time, image (use existing placeholder set or category-tinted SVGs — no image gen).
- Filters on `/products`: category, industry, region, supplier type, verified only, price range, MOQ, sort (relevance/price/rating/newest). Persist filter state in `localStorage`.
- Product card buttons all functional: View Product, Request Quote (→ Messages + auto-open request modal), Message Supplier (→ Messages), View Supplier.

## 7. Cross-linking to Messages

- Product detail: Request Custom Quote → navigate `/messages?supplier=<id>&intent=request` → messages route reads query, opens/creates thread, auto-opens `RequestCustomQuoteModal` prefilled with product.
- Supplier profile: same pattern for Message + Request Custom Quote.
- RFQ quote row: Message Supplier, Ask for Custom Offer (opens Messages with intent), Accept Quote (existing flow).

## 8. Header / account dropdown

- Add role switcher ("View as Buyer / Supplier / Admin") in `AppShell` account menu.
- Bell component beside it.
- Rebuilds bell + action menus reactively when role changes.

## 9. Reset

- Admin settings / `/admin` gets a "Reset Demo Data" button calling `resetAll()` + `seed()`.

## 10. Cleanup

- Remove or stub any remaining calls to `useSuppliers`/`db.ts` backend paths that trigger "This page didn't load." Replace with sync reads from stores.
- Keep Supabase integration files untouched (auto-generated) but ensure no route imports them at load time.

## Technical notes

- All new state hooks use `useSyncExternalStore` via the `createStore` helper for consistent rerenders and SSR safety (`typeof window` guard, initial snapshot = seed).
- Reads that happen in route loaders stay out — everything is client-only to avoid SSR/localStorage mismatches. Route components render skeletons then hydrate from the store.
- No new npm deps.
- No changes to auth, Supabase clients, server functions, or `src/routeTree.gen.ts` (router plugin regenerates).

## Deliverables checklist (maps to acceptance criteria)

Messages send/persist · paperclip menu · in-chat custom request · in-chat custom offer · accept → order · Orders detail + status buttons · demo escrow fund/release/dispute/refund · notifications created + bell dropdown · off-platform warning · report/dispute · `/admin/safety` · 90+ products across 20 industries · filters · product/supplier/RFQ → Messages links · no dead buttons · no broken pages · localStorage persistence · Reset Demo Data.
