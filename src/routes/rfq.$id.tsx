import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Rating, Stat, VerifiedBadge } from "@/components/ui-bits";
import { rfqs, supplierById, formatPhp } from "@/lib/mock-data";
import { Clock, MapPin, Wallet, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/rfq/$id")({
  loader: ({ params }) => {
    const r = rfqs.find((x) => x.id === params.id);
    if (!r) throw notFound();
    return { rfq: r };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.rfq.title ?? "RFQ"} — PSG` }] }),
  notFoundComponent: () => (<AppShell><div className="p-20 text-center">RFQ not found</div></AppShell>),
  errorComponent: ({ reset }) => (<AppShell><div className="p-12 text-center"><button onClick={reset}>Retry</button></div></AppShell>),
  component: RFQDetail,
});

function RFQDetail() {
  const { rfq: r } = Route.useLoaderData();

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Link to="/rfq" className="text-xs text-muted-foreground hover:text-primary">← Back to RFQ Marketplace</Link>
          <div className="mt-2 flex items-center gap-2 mb-1">
            <span className="chip chip-primary">{r.category}</span>
            <span className={`chip ${r.status === "Open" ? "chip-verified" : "chip-gold"}`}>{r.status}</span>
          </div>
          <h1 className="font-display text-3xl">{r.title}</h1>
          <div className="text-sm text-muted-foreground mt-1">{r.buyer} · {r.buyerType} · posted {r.postedAgo}</div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <Stat label="Quantity" value={r.qty} />
              <Stat label="Budget" value={r.budgetPhp} />
              <Stat label="Deliver by" value={r.deliverBy} />
              <Stat label="Region" value={r.region} />
            </div>
            <div className="mt-5">
              <div className="text-sm font-semibold mb-1">Buyer brief</div>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{r.description}</p>
            </div>
          </div>

          {/* Quotes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-2xl">Quotes received ({r.quotes.length})</h2>
              <div className="text-xs text-muted-foreground">Sorted by price</div>
            </div>
            <div className="space-y-3">
              {[...r.quotes].sort((a, b) => a.pricePhp - b.pricePhp).map((q, i) => {
                const s = supplierById(q.supplierId);
                const best = i === 0;
                return (
                  <div key={q.supplierId} className={`rounded-lg border bg-card p-4 ${best ? "border-primary ring-1 ring-primary/30" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="size-12 rounded-md bg-gradient-to-br from-primary to-gold grid place-items-center text-white font-display text-xl shrink-0">
                          {s.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link to="/suppliers/$id" params={{ id: s.id }} className="font-semibold hover:text-primary truncate">
                              {s.name}
                            </Link>
                            {s.verified && <VerifiedBadge />}
                            {best && <span className="chip chip-primary">Best price</span>}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {s.type} · {s.location}
                          </div>
                          <div className="text-xs mt-1 flex gap-2">
                            <Rating value={s.rating} count={s.reviews} />
                            <span className="text-muted-foreground">· {s.transactions} orders</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {q.pricePhp > 0 ? (
                          <>
                            <div className="font-display text-3xl text-primary leading-none">{formatPhp(q.pricePhp)}</div>
                            <div className="text-xs text-muted-foreground">per unit</div>
                          </>
                        ) : (
                          <div className="text-sm font-semibold">Sample first</div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <Mini label="MOQ" value={q.moq ? `${q.moq}` : "—"} />
                      <Mini label="Lead time" value={`${q.leadTimeDays} days`} />
                      <Mini label="Response" value={s.responseTime} />
                    </div>
                    {q.note && <p className="text-sm mt-3 text-muted-foreground italic">"{q.note}"</p>}
                    <div className="mt-3 flex gap-2">
                      <button className="flex-1 bg-primary text-primary-foreground rounded-md py-2 text-sm font-semibold">Accept & convert to order</button>
                      <Link to="/messages" className="border rounded-md px-3 py-2 text-sm font-semibold flex items-center gap-1.5">
                        <MessageSquare size={14} /> Chat
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg gradient-ink text-white p-5">
            <div className="text-xs uppercase tracking-wider text-[oklch(0.78_0.15_75)] font-semibold mb-2">How it works</div>
            <ol className="text-sm space-y-2 opacity-90">
              <li>1. Compare quotes across price, lead time, MOQ.</li>
              <li>2. Tap "Accept" to convert into a draft order.</li>
              <li>3. Pay into escrow. Supplier ships.</li>
              <li>4. Confirm delivery to release payment.</li>
            </ol>
          </div>
          <div className="rounded-lg border bg-card p-5 text-sm space-y-2">
            <div className="font-semibold">Need help choosing?</div>
            <p className="text-muted-foreground">A PSG concierge can review your quotes for ₱0 on your first RFQ.</p>
            <button className="w-full mt-2 border rounded-md py-2 font-semibold">Request review</button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-muted px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
