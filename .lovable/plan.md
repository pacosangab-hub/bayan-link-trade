# Xendit Payments Integration — PSG Supply Gateway

Replace the mock checkout payment step with real Xendit-hosted checkout (test mode first), supporting GCash, Maya, ShopeePay, cards, and bank transfer / direct debit via a single Xendit **Invoice** (their all-in-one hosted page). Orders move to `paid` automatically via a webhook that releases funds into PSG's simulated escrow.

Xendit has no prebuilt Lovable connector, so we wire it as a custom integration: secret-stored API key + TanStack server functions + a public webhook route.

---

## Part 1 — Getting your Xendit account (before we build)

I'll walk you through this in chat when we start; nothing to do now.

1. Sign up at **dashboard.xendit.co** (free, no verification needed for test mode).
2. Business info: use "Philippine Supply Gateway" (or your registered name), country Philippines, industry B2B Marketplace.
3. **Stay in Test Mode** (toggle top-right of the dashboard). Test mode gives you working GCash/Maya/card/bank sandboxes with fake money — no KYC needed.
4. Go to **Settings → Developers → API Keys** → generate a **Secret API Key** (starts with `xnd_development_...`). Copy it.
5. Go to **Settings → Developers → Webhooks** → we'll paste the webhook URL here after Step 3 below deploys.
6. Go live later: submit KYC docs (SEC/DTI registration, valid ID, bank account) in the dashboard; swap the test key for a live key in one place.

---

## Part 2 — What gets built

### Step 1 — Secret + server client
- Request `XENDIT_SECRET_KEY` via the secure secret form (test key first, swap to live later with one update).
- Add a thin server-only Xendit helper `src/lib/xendit.server.ts` (Basic Auth against `https://api.xendit.co`).

### Step 2 — Create-invoice server function
`src/lib/xendit.functions.ts` → `createXenditInvoice({ orderId })`:
- Loads the order from cart/order storage.
- Calls `POST /v2/invoices` with amount = order total (PHP), `external_id = orderId`, `payment_methods = ["GCASH","PAYMAYA","SHOPEEPAY","CREDIT_CARD","BPI","BDO","UNIONBANK","METROBANK"]`, success/failure redirect URLs pointing back to the order page.
- Returns `{ invoice_url, invoice_id }`.

### Step 3 — Checkout wiring
Update `src/routes/checkout.tsx`:
- Keep the delivery-method selection exactly as-is.
- In the Payment Method section, keep the same visual options but they now map to Xendit payment channels (Escrow stays as the wrapper label — "PSG Escrow via Xendit").
- "Confirm & Place Order" now:
  1. Creates the order locally in status `pending_payment`.
  2. Calls `createXenditInvoice`.
  3. Redirects the buyer to `invoice_url` (Xendit hosted page — GCash, Maya, ShopeePay, cards, banks all on one page).
- On return (success/fail redirect), buyer lands on `/orders/$id`; UI reads status.

### Step 4 — Webhook (public route)
`src/routes/api/public/xendit-webhook.ts` — TanStack file route:
- Verifies `x-callback-token` header against `XENDIT_WEBHOOK_TOKEN` secret (timing-safe compare).
- Handles `invoice.paid` → mark order `paid` and move into escrow (existing `escrowOrder` flow).
- Handles `invoice.expired` / `invoice.failed` → mark order `payment_failed`, restore cart.
- Idempotent by `invoice_id`.

Stable URL to paste in Xendit dashboard: `https://psgsupplygateway.lovable.app/api/public/xendit-webhook`.

### Step 5 — Order page updates
`src/routes/orders.$id.tsx`:
- Show payment status badge (Pending Payment / Paid / Failed).
- If pending, show "Complete payment" button re-opening the Xendit invoice URL (saved on the order).
- Escrow release logic unchanged (releases on delivery confirmation).

### Step 6 — Test-mode verification
Walk through one test purchase per method (GCash sandbox, card `4000 0000 0000 0002`, bank sim) and confirm webhook flips order to paid.

---

## Technical details

**Auth**: Xendit uses HTTP Basic Auth with the secret key as username and empty password. Server-side only.

**Endpoints used**:
- `POST /v2/invoices` — create hosted checkout page
- `GET /v2/invoices/:id` — status poll fallback if webhook delayed
- Webhook events: `invoice.paid`, `invoice.expired`

**Secrets stored**:
- `XENDIT_SECRET_KEY` (test → live swap)
- `XENDIT_WEBHOOK_TOKEN` (user sets in Xendit dashboard, mirrored here)

**Files touched**:
- New: `src/lib/xendit.server.ts`, `src/lib/xendit.functions.ts`, `src/routes/api/public/xendit-webhook.ts`
- Edited: `src/routes/checkout.tsx`, `src/routes/orders.$id.tsx`, `src/lib/cart.ts` (add `pending_payment` status + `xenditInvoiceId`/`xenditInvoiceUrl` on the order)

**Fees for your reference**: Xendit test mode is free. Live: ~2.0–2.5% cards, ~2.0–2.5% GCash/Maya, ~PHP 15 flat direct debit — see xendit.co/ph/pricing.

**Out of scope for this plan**: Transportify (we'll plan that separately when you're ready), refunds/partial captures (can add later), payouts to suppliers (Xendit has a Disbursements API — separate feature).

---

Approve this and I'll start with Step 1 (requesting your Xendit test key) and walk you through the dashboard signup in chat.
