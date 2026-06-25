import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/docs")({
  head: () => ({ meta: [{ title: "PRD & Architecture — PSG" }] }),
  component: Docs,
});

function Docs() {
  return (
    <AppShell>
      <div className="bg-ink text-white">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="text-xs uppercase tracking-[0.2em] text-[oklch(0.78_0.15_75)] font-semibold mb-2">
            Founders' Brief
          </div>
          <h1 className="font-display text-4xl md:text-5xl">PSG — Product Requirements & MVP Plan</h1>
          <p className="text-white/80 mt-3 max-w-2xl">
            What we ship in 90 days, why, and what we deliberately don't build. Think Alibaba 2003, Faire 2017, Udaan 2018 — adapted for Philippine commerce.
          </p>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-4 py-10 prose-doc">
        <H>1 · Vision & MVP Thesis</H>
        <P>
          PSG is the B2B wholesale marketplace connecting Philippine <b>manufacturers, farmers, distributors, and importers</b> directly with <b>business buyers</b> — restaurants, carinderias, hotels, pharmacies, contractors, schools, offices, and sari-sari stores.
        </P>
        <P>
          The MVP proves <b>one loop</b>: <i>Buyer finds supplier → places order → supplier fulfills → buyer reorders.</i> Everything else — logistics, BNPL, warehouses, financing, ERP — comes after we prove repeat behavior.
        </P>

        <H>2 · Scope (and Anti-Scope)</H>
        <Two>
          <Card title="What we build">
            <ul>
              <li>Product catalog & supplier directory</li>
              <li>RFQ marketplace + quote comparison</li>
              <li>Order management</li>
              <li>Escrow payments (PSG-mediated)</li>
              <li>Buyer ↔ supplier messaging</li>
              <li>Reviews & ratings</li>
              <li>Business KYC + verification badges</li>
              <li>Admin/trust console</li>
            </ul>
          </Card>
          <Card title="What we DO NOT build" warn>
            <ul>
              <li>Owned logistics / fleet</li>
              <li>Warehousing</li>
              <li>BNPL / credit lines</li>
              <li>AI demand forecasting</li>
              <li>ERP / accounting modules</li>
              <li>Native mobile apps (responsive web first)</li>
              <li>Cross-border / FX</li>
            </ul>
            <p className="text-xs text-muted-foreground mt-2">
              Why: every one of these turns PSG from a marketplace into an operation. We earn the right to build them after we have liquidity.
            </p>
          </Card>
        </Two>

        <H>3 · User Types</H>
        <Two>
          <Card title="Buyers">
            Restaurants, carinderias, hotels, pharmacies, contractors, schools, offices, sari-sari stores. They <i>search → RFQ → order → confirm → reorder → review</i>.
          </Card>
          <Card title="Sellers">
            Manufacturers, distributors, farmer co-ops, importers. They <i>upload catalog → receive orders & RFQs → chat → fulfill → get paid out of escrow</i>.
          </Card>
        </Two>
        <Card title="Admin / PSG Trust Ops">
          KYC review, dispute mediation, escrow release decisions, fraud monitoring, supplier health, GMV dashboards.
        </Card>

        <H>4 · The Escrow Workflow (state machine)</H>
        <Pre>{`Order Created
   │  buyer pays into PSG escrow
   ▼
Awaiting Supplier Acceptance ─▶ (reject) Refund Buyer
   │  supplier accepts
   ▼
Funds Held in Escrow
   ▼
Preparing Shipment
   ▼
In Transit
   ▼
Delivered — Awaiting Confirmation
   │  buyer confirms (or 72h auto-release)
   ▼
Released to Supplier ✓

   ↳ Any step: buyer can open Dispute → admin mediates → refund / partial / release`}</Pre>

        <H>5 · Database Schema (essentials)</H>
        <Pre>{`users(id, email, mobile, name, role[buyer|supplier|admin], created_at)
businesses(id, user_id, legal_name, type, region, city, years_op, description, verified_at)
documents(id, business_id, type[DTI|BIR|Mayors|FDA|...], file_url, status)
verifications(id, business_id, reviewer_id, status, notes)
products(id, supplier_id, title, category, unit, moq, price, lead_time_days, stock, image, description)
tier_pricing(id, product_id, qty, price)
categories(id, name, slug)
rfqs(id, buyer_id, title, category, qty, budget, deliver_by, region, description, status)
rfq_quotes(id, rfq_id, supplier_id, price, moq, lead_time_days, note, status)
orders(id, buyer_id, supplier_id, total, escrow_state, placed_at, delivery_address)
order_items(id, order_id, product_id, qty, unit_price)
escrow_accounts(id, order_id, amount_held, fee, released_at, state)
disputes(id, order_id, opened_by, reason, status, resolution)
conversations(id, buyer_id, supplier_id, last_msg_at)
messages(id, conversation_id, sender_id, body, sent_at, read_at)
reviews(id, order_id, buyer_id, supplier_id, rating, body)
notifications(id, user_id, type, payload, read_at)
audit_logs(id, actor_id, action, target, meta, at)`}</Pre>

        <H>6 · Architecture</H>
        <Pre>{`┌─────────────────────────────────────────────────────────────────┐
│           Web (Next/TanStack Start) · Mobile-responsive          │
└──────────┬─────────────────────────────────────────┬─────────────┘
           │ tRPC / typed RPC                         │
┌──────────▼──────────┐  ┌──────────────────┐  ┌─────▼──────────┐
│  Edge BFF / API     │  │  Search (Meili)  │  │ Realtime (WS)  │
└──────────┬──────────┘  └────────┬─────────┘  └─────┬──────────┘
           │                      │                  │
┌──────────▼──────────┐  ┌────────▼─────────┐  ┌─────▼──────────┐
│  Postgres (Supabase)│  │ Object storage   │  │  Notif worker  │
│   + RLS, Row Sec    │  │  (S3/R2)         │  │ (email/SMS)    │
└──────────┬──────────┘  └──────────────────┘  └────────────────┘
           │
┌──────────▼──────────┐
│  Payments (GCash,   │
│  Maya, bank, card)  │
│  → PSG escrow ledger│
└─────────────────────┘`}</Pre>

        <H>7 · Recommended Tech Stack</H>
        <ul>
          <li><b>Frontend:</b> React + TanStack Start, Tailwind v4, shadcn — fast SSR, file-based routing, type-safe.</li>
          <li><b>Backend:</b> TanStack server functions (or tRPC), Postgres via Supabase (auth + RLS + storage out of the box).</li>
          <li><b>Search:</b> Meilisearch — instant typo-tolerant search across products, suppliers, RFQs.</li>
          <li><b>Payments:</b> Xendit (GCash, Maya, cards, bank). Escrow tracked in a PSG ledger table, payouts batched daily.</li>
          <li><b>Notifications:</b> Resend (email) + Twilio (SMS). RFQ matches and order-state changes are the highest-ROI sends.</li>
          <li><b>Realtime chat:</b> Supabase Realtime or Pusher Channels.</li>
          <li><b>Admin tooling:</b> Internal admin built into the app (under <code>/admin</code>); use Retool only if speed becomes critical.</li>
          <li><b>Analytics:</b> PostHog (product) + Metabase on Postgres (BI).</li>
          <li><b>Hosting:</b> Cloudflare Pages/Workers + Supabase.</li>
        </ul>

        <H>8 · 90-Day Roadmap</H>
        <Two>
          <Card title="Phase 1 · Days 0–30">
            <ul>
              <li>Manual supplier onboarding (50 hand-curated)</li>
              <li>500 SKUs across rice, produce, seafood, coffee, paper, pharma, construction</li>
              <li>Product catalog, supplier directory, search, filters</li>
              <li>Buyer/supplier KYC + verification badges</li>
              <li>Order placement + escrow MVP (manual ledger if needed)</li>
              <li>Messaging</li>
              <li>Metro Manila only · seller-managed logistics</li>
            </ul>
          </Card>
          <Card title="Phase 2 · Days 31–60">
            <ul>
              <li>RFQ marketplace live (the wedge)</li>
              <li>Tier pricing, reorders</li>
              <li>Dispute tooling + admin console</li>
              <li>Reviews & ratings</li>
              <li>Push 200 buyers via field activation in QC, Pasig, Makati</li>
            </ul>
          </Card>
          <Card title="Phase 3 · Days 61–90">
            <ul>
              <li>Supplier analytics dashboard</li>
              <li>Notifications (email + SMS)</li>
              <li>Expand to CALABARZON suppliers</li>
              <li>Hit ₱5M monthly GMV target</li>
              <li>Lock in first 10 contract-buyers on recurring RFQs</li>
            </ul>
          </Card>
          <Card title="Phase 4 · Day 91+">
            <ul>
              <li>Logistics integrations (Lalamove/Transportify per order)</li>
              <li>Supplier financing pilots (post-12 months of escrow history)</li>
              <li>Mobile-app shell (PWA → React Native)</li>
              <li>Province-tier expansion</li>
            </ul>
          </Card>
        </Two>

        <H>9 · Success Metrics</H>
        <Two>
          <Card title="MVP KPIs">
            <ul>
              <li>Active suppliers (target 50 → 120)</li>
              <li>Active monthly buyers (target 200 → 600)</li>
              <li>Monthly RFQs posted</li>
              <li>RFQ → order conversion (≥ 25%)</li>
              <li>Supplier first-response time (&lt; 6h median)</li>
              <li>Escrow completion rate (≥ 96%)</li>
              <li>30-day GMV</li>
            </ul>
          </Card>
          <Card title="🌟 North-Star Metric">
            <p className="font-display text-2xl text-primary mt-1">Repeat purchase rate</p>
            <p className="text-sm text-muted-foreground mt-1">
              % of buyers placing a second order with the same supplier within 30 days. This is the only signal that proves PSG is creating durable supplier relationships, not one-shot transactions.
            </p>
          </Card>
        </Two>

        <H>10 · API Endpoints (excerpt)</H>
        <Pre>{`POST /api/auth/signup
POST /api/businesses                    create + KYC docs
GET  /api/products?cat=...&region=...   discovery
GET  /api/products/:id
POST /api/rfqs                          buyer posts
POST /api/rfqs/:id/quotes               supplier responds
POST /api/orders                        accept quote or buy now
POST /api/orders/:id/pay                → escrow_held
POST /api/orders/:id/accept             supplier acceptance
POST /api/orders/:id/ship               status → in transit
POST /api/orders/:id/confirm            buyer → escrow released
POST /api/orders/:id/dispute
GET  /api/conversations
POST /api/messages
POST /api/reviews
GET  /api/admin/verifications/pending
POST /api/admin/escrow/:id/release`}</Pre>

        <H>11 · Trust Layer</H>
        <P>
          PSG only wins if buyers trust they won't get burned and suppliers trust they'll get paid. Verification badges, escrow on every transaction, transparent ratings, and visible repeat-buyer counts compound that trust. <b>Trust is the product.</b>
        </P>
      </article>
    </AppShell>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-3xl mt-12 mb-3">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-foreground/85 leading-relaxed mb-3">{children}</p>;
}
function Two({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-2 gap-4 my-4">{children}</div>;
}
function Card({ title, warn, children }: { title: string; warn?: boolean; children: React.ReactNode }) {
  return (
    <div className={`rounded-lg border bg-card p-5 ${warn ? "border-primary/40 bg-primary/5" : ""}`}>
      <div className={`font-semibold mb-2 ${warn ? "text-primary" : ""}`}>{title}</div>
      <div className="text-sm space-y-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">{children}</div>
    </div>
  );
}
function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="text-xs leading-relaxed bg-ink text-white/90 rounded-lg p-4 overflow-x-auto my-3 font-mono">
      {children}
    </pre>
  );
}
