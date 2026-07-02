
# Redesign RFQ Center → "Get Supplier Quotes"

Transform the RFQ pages from a static list into a functional B2B procurement workflow with clear buyer and supplier journeys. All existing routes for products, suppliers, orders, and messages remain untouched.

## Scope of files

- **Rewrite** `src/routes/rfq.tsx` — hero, "How it works", tabs (Buyer Requests / Supplier Leads), dashboard stats, cards with next-action labels.
- **Rewrite** `src/routes/rfq.$id.tsx` — split layout with buyer brief + status timeline (left) and quote comparison table with "Recommended Best Value" (right); Choose Supplier confirmation modal → "Supplier Selected" state.
- **Rewrite** `src/routes/rfq.new.tsx` — 4-step guided form (What you need → Budget & delivery → Requirements → Review) with progress indicator; redirects to new RFQ detail with success toast.
- **Extend** `src/lib/mock-data.ts` — add the 5 demo Filipino B2B RFQs (rice, tissue, espresso, boxes, chicken), extend `RFQ` type with `unit`, `recurring`, `deliveryLocation`, `nextAction`, and expand status union to: Draft, Open, Receiving Quotes, Awaiting Decision, Supplier Selected, Order Created, Completed, Closed.
- **New** `src/components/rfq/SubmitQuoteModal.tsx` — supplier quote-submission modal (price/unit, total, MOQ, lead time, delivery fee, payment terms, stock, message, upload placeholder) with success toast.
- **New** `src/components/rfq/ChooseSupplierModal.tsx` — confirmation modal used from the detail page.
- **New** `src/lib/rfq-store.ts` — lightweight localStorage store (mirroring `src/lib/cart.ts` pattern with `useSyncExternalStore` + reference-stable cache) for demo-created RFQs, submitted quotes, and selected supplier so state persists across navigation.

No changes to `AppShell` nav label ("RFQ Center" stays in top nav); the in-page H1 becomes "Get Supplier Quotes" with "RFQ Marketplace" eyebrow.

## Page 1 — `/rfq` (list)

**Hero (bold red band):**
- Eyebrow: RFQ Marketplace
- H1: Get Supplier Quotes
- Sub: Post what your business needs. Verified suppliers will send prices, lead times, and delivery terms.
- Primary CTA: `+ Post a Quote Request` → `/rfq/new`
- Secondary: How it works (scrolls to steps)

**3-step strip** (icon cards): Post what you need · Suppliers send quotes · Compare and choose.

**Tabs:** Buyer Requests (default) · Supplier Leads.

**Buyer Requests tab:**
- 4 stat cards: Open Requests, Quotes Received, Awaiting Decision, Completed Orders.
- RFQ cards showing category + status + posted-ago, title, buyer, and 5 stat boxes (Quantity, Budget, Delivery location, Needed by, Quotes received).
- Prominent next-action ribbon (e.g. "3 new quotes — Review now", "No quotes yet — Share request").
- Actions: **View Quotes** (primary → detail), Edit Request, Close Request.

**Supplier Leads tab:**
- Header "Find Buyers Looking for Your Products" + filter bar (Category, Location, Budget, Deadline, Recurring, Sort).
- Cards show buyer, product, quantity, budget, location, deadline, existing-quotes count, verified badge.
- Primary action: **Submit Quote** → opens `SubmitQuoteModal`.

## Page 2 — `/rfq/:id` (detail)

Two-column layout.

**Left:** buyer brief, quantity, target budget, delivery location, deadline, notes, attachments placeholder, status timeline (Draft → Open → Receiving Quotes → Awaiting Decision → Supplier Selected → Order Created → Completed).

**Right:** quote comparison table with columns Supplier, Price, Delivery time, MOQ, Rating, Verification, Action. Best-value quote gets a gold "Recommended Best Value" badge (scored by price + rating + lead time). Row actions: View Supplier (→ `/suppliers/$id`), Message (→ `/messages`), **Choose Supplier** (opens `ChooseSupplierModal`).

**Choose Supplier modal:** confirmation copy about moving to order creation + escrow. Confirm sets status to Supplier Selected via `rfq-store`, and swaps the right pane to an Order Summary card with a "Continue to Checkout" CTA (routes to existing `/checkout`).

## Page 3 — `/rfq/new` (guided form)

Multi-step wizard with a top progress bar (Step X of 4). Uses local component state; final submit writes a new RFQ into `rfq-store`, navigates to `/rfq/:id` for the new id, and fires a success toast: "Your quote request is live. Verified suppliers can now submit offers."

- Step 1 – What do you need: product name, category, quantity, unit, one-time vs recurring.
- Step 2 – Budget & delivery: target budget, delivery location, needed-by date, preferred schedule.
- Step 3 – Supplier requirements: verified-only toggle, required documents (multi-select chips), notes.
- Step 4 – Review & post: summary card + Post Request button.

Back/Next buttons; validation is light (required fields only) to keep demo smooth.

## Data & status model

Extend `RFQ` type and seed 5 realistic entries listed in the brief. Statuses use consistent chip colors: gray (Draft/Closed), blue (Open/Receiving Quotes), amber (Awaiting Decision), green (Supplier Selected/Order Created/Completed). `nextAction` is derived per card.

## Technical notes

- All navigation uses `<Link to="/rfq/$id" params={{ id }}>` — never string interpolation.
- Modals use existing shadcn `Dialog`.
- Toasts via existing `sonner`.
- `rfq-store` follows the same reference-stable `useSyncExternalStore` pattern as `src/lib/cart.ts` to avoid the infinite-loop issue fixed previously.
- No backend changes — pure frontend + localStorage.

## Acceptance mapping

Each item in the brief's acceptance criteria (1–10) is covered: clarity within 5 seconds (hero + 3-step + tabs), separated workflows (tabs), guided posting (4-step wizard), quote comparison (detail table with best-value badge), supplier submission (modal), choose-supplier flow (confirmation + order handoff), all buttons wired to real routes/modals with demo data, PSG branding preserved, existing routes untouched.
