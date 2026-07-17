import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Rating, statusChipClass } from "@/components/ui-bits";
import { supplierById, formatPhp } from "@/lib/mock-data";
import type { RFQStatus, DeliveryMethod } from "@/lib/mock-data";
import { useRfq, getRfq } from "@/lib/rfq-store";
import { MapPin, Calendar, Package, Wallet, ShieldCheck, MessageSquare, ArrowRight, CheckCircle2, Sparkles, Paperclip, Truck, Building2, Zap, Award } from "lucide-react";
import { useState } from "react";


export const Route = createFileRoute("/rfq/$id")({
  loader: ({ params }) => {
    const r = getRfq(params.id);
    if (!r) throw notFound();
    return { id: params.id };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `Quote Request ${loaderData?.id ?? ""} — PSG` }] }),
  notFoundComponent: () => (
    <AppShell>
      <div className="p-20 text-center">
        <h1 className="font-display text-3xl">Quote request not found</h1>
        <Link to="/rfq" className="text-primary underline mt-4 inline-block">Back to Get Supplier Quotes</Link>
      </div>
    </AppShell>
  ),
  errorComponent: ({ reset }) => (
    <AppShell>
      <div className="p-12 text-center"><button onClick={reset} className="border px-4 py-2 rounded">Retry</button></div>
    </AppShell>
  ),
  component: RFQDetail,
});

const TIMELINE: RFQStatus[] = ["Draft", "Open", "Receiving Quotes", "Awaiting Decision", "Supplier Selected", "Order Created", "Completed"];

function RFQDetail() {
  const { id } = Route.useLoaderData();
  const r = useRfq(id);
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<"value" | "price" | "lead">("value");

  if (!r) return null;

  const idx = Math.max(0, TIMELINE.indexOf(r.status));
  const bestQuoteId = pickBestQuote(r.quotes);
  const fastestId = pickByField(r.quotes, "leadTimeDays");
  const cheapestId = pickCheapest(r.quotes);
  const selected = r.selectedSupplierId ? r.quotes.find((q) => q.supplierId === r.selectedSupplierId) : null;
  const qtyNum = parseFloat(r.qty.match(/[\d.]+/)?.[0] || "1") || 1;


  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Link to="/rfq" className="text-xs text-muted-foreground hover:text-primary">← Back to Get Supplier Quotes</Link>
          <div className="mt-2 flex items-center gap-2 flex-wrap mb-1">
            <span className="chip chip-primary">{r.category}</span>
            <span className={`chip ${statusChipClass(r.status)}`}>{r.status}</span>
            <span className="text-xs text-muted-foreground">Posted {r.postedAgo}</span>
          </div>
          <h1 className="font-display text-3xl">{r.title}</h1>
          <div className="text-sm text-muted-foreground mt-1">{r.buyer} · {r.buyerType}</div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[380px_1fr] gap-6">
        {/* LEFT — request brief */}
        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Buyer Request</div>
            <div className="space-y-3 text-sm">
              <Row icon={<Package size={14} />} label="Quantity" value={r.qty} />
              <Row icon={<Wallet size={14} />} label="Target budget" value={r.budgetPhp} />
              <Row icon={<MapPin size={14} />} label="Delivery location" value={r.deliveryLocation ?? r.region} />
              <Row icon={<Calendar size={14} />} label="Delivery deadline" value={r.deliverBy} />
              {r.recurring && <Row icon={<Sparkles size={14} />} label="Order type" value="Recurring supply" />}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs font-semibold mb-1">Notes / specifications</div>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{r.description}</p>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs font-semibold mb-2 flex items-center gap-1"><Paperclip size={12} /> Attachments</div>
              <div className="border-2 border-dashed rounded-md py-4 grid place-items-center text-xs text-muted-foreground">
                No attachments (placeholder)
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Status Timeline</div>
            <ol className="space-y-2.5">
              {TIMELINE.map((step, i) => {
                const done = i < idx;
                const current = i === idx;
                return (
                  <li key={step} className="flex gap-2.5 items-center text-sm">
                    <div className={`size-5 rounded-full grid place-items-center text-[10px] font-bold ${done ? "bg-success text-white" : current ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                      {done ? "✓" : i + 1}
                    </div>
                    <span className={current ? "font-semibold text-primary" : done ? "" : "text-muted-foreground"}>{step}</span>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        {/* RIGHT — quotes / order summary */}
        <div className="space-y-6">
          {selected ? (
            <OrderSummary supplierId={selected.supplierId} pricePhp={selected.pricePhp} rfqTitle={r.title} qty={r.qty} onContinue={() => navigate({ to: "/rfq/$id/accept", params: { id: r.id }, search: { supplier: selected.supplierId } })} />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl">Quote comparison ({r.quotes.length})</h2>
                  <p className="text-xs text-muted-foreground">Compare price, delivery, and total landed cost. Recommended offer highlighted.</p>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-muted-foreground mr-1">Sort by:</span>
                  {(["value", "price", "lead"] as const).map((k) => (
                    <button key={k} onClick={() => setSortBy(k)} className={`px-2.5 py-1 rounded-md border ${sortBy === k ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>
                      {k === "value" ? "Best value" : k === "price" ? "Lowest price" : "Fastest"}
                    </button>
                  ))}
                </div>
              </div>
              {r.quotes.length === 0 ? (
                <div className="rounded-lg border bg-card p-10 text-center">
                  <div className="font-display text-xl mb-1">No quotes yet</div>
                  <p className="text-sm text-muted-foreground">Verified suppliers have been notified. First quotes typically arrive in 2–6 hours.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {sortQuotes(r.quotes, sortBy, bestQuoteId).map((q) => {
                    const s = supplierById(q.supplierId);
                    const fee = q.deliveryFee ?? 0;
                    const subtotal = q.pricePhp * qtyNum;
                    const total = subtotal + fee;
                    const tags: { label: string; cls: string; icon: any }[] = [];
                    if (q.supplierId === bestQuoteId) tags.push({ label: "Best value", cls: "chip-gold", icon: Award });
                    if (q.supplierId === cheapestId && q.supplierId !== bestQuoteId) tags.push({ label: "Lowest price", cls: "chip-primary", icon: Wallet });
                    if (q.supplierId === fastestId && q.supplierId !== bestQuoteId) tags.push({ label: "Fastest", cls: "chip-verified", icon: Zap });
                    return (
                      <div key={q.supplierId} className={`rounded-lg border-2 bg-card p-4 grid md:grid-cols-[1.4fr_1fr_1fr_auto] gap-4 items-center ${q.supplierId === bestQuoteId ? "border-primary" : ""}`}>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link to="/suppliers/$id" params={{ id: s.id }} className="font-semibold hover:text-primary truncate">{s.name}</Link>
                            {s.verified && <ShieldCheck size={14} className="text-success" />}
                            {tags.map((t) => {
                              const Icon = t.icon;
                              return <span key={t.label} className={`chip ${t.cls} text-[10px] inline-flex items-center gap-1`}><Icon size={10} /> {t.label}</span>;
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{s.location} · <Rating value={s.rating} /> ({s.reviews})</div>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center gap-1"><Package size={11} /> MOQ {q.moq}</span>
                            <span className="inline-flex items-center gap-1">{q.deliveryMethod === "pickup" ? <Building2 size={11} /> : <Truck size={11} />} {deliveryLabel(q.deliveryMethod)}</span>
                            {q.paymentTerms && <span className="chip text-[10px]">{q.paymentTerms}</span>}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Unit price</div>
                          <div className="font-display text-lg">{q.pricePhp > 0 ? formatPhp(q.pricePhp) : "Sample first"}</div>
                          <div className="text-xs text-muted-foreground">Lead time: {q.leadTimeDays} days</div>
                        </div>
                        <div>
                          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total landed cost</div>
                          <div className="font-display text-lg">{formatPhp(total)}</div>
                          <div className="text-xs text-muted-foreground">{formatPhp(subtotal)} + {fee ? formatPhp(fee) + " delivery" : "free delivery"}</div>
                        </div>
                        <div className="flex md:flex-col gap-2 md:items-stretch">
                          <Link to="/messages" className="text-xs border rounded px-3 py-2 hover:bg-muted inline-flex items-center justify-center gap-1"><MessageSquare size={12} /> Message</Link>
                          <Link to="/rfq/$id/accept" params={{ id: r.id }} search={{ supplier: q.supplierId }} className="text-xs bg-primary text-primary-foreground rounded px-3 py-2 font-semibold inline-flex items-center justify-center gap-1">
                            Accept quote <ArrowRight size={12} />
                          </Link>
                        </div>
                        {q.note && (
                          <div className="md:col-span-4 text-xs text-muted-foreground italic pt-3 border-t border-dashed">"{q.note}"</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}


function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-primary mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

function OrderSummary({ supplierId, pricePhp, rfqTitle, qty, onContinue }: { supplierId: string; pricePhp: number; rfqTitle: string; qty: string; onContinue: () => void }) {
  const s = supplierById(supplierId);
  return (
    <div className="rounded-lg border-2 border-primary bg-card p-6">
      <div className="flex items-center gap-2 text-primary font-semibold mb-1">
        <CheckCircle2 size={18} /> Supplier Selected
      </div>
      <div className="font-display text-2xl mb-4">Order Summary</div>
      <div className="space-y-2 text-sm border-t border-b py-4">
        <Line label="Request" value={rfqTitle} />
        <Line label="Supplier" value={s.name} />
        <Line label="Quantity" value={qty} />
        <Line label="Unit price" value={pricePhp > 0 ? formatPhp(pricePhp) : "TBD"} />
        <Line label="Payment protection" value="PSG Escrow" />
      </div>
      <button
        onClick={onContinue}
        className="mt-5 w-full bg-primary text-primary-foreground font-semibold py-3 rounded-md inline-flex items-center justify-center gap-2"
      >
        Continue to Checkout <ArrowRight size={16} />
      </button>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function pickBestQuote(quotes: { supplierId: string; pricePhp: number; leadTimeDays: number }[]): string | null {
  if (quotes.length === 0) return null;
  const prices = quotes.map((q) => q.pricePhp).filter((p) => p > 0);
  const maxPrice = Math.max(...prices, 1);
  const maxLead = Math.max(...quotes.map((q) => q.leadTimeDays), 1);
  let bestId = quotes[0].supplierId;
  let bestScore = -Infinity;
  for (const q of quotes) {
    const s = supplierById(q.supplierId);
    const priceScore = q.pricePhp > 0 ? (1 - q.pricePhp / maxPrice) * 40 : 0;
    const leadScore = (1 - q.leadTimeDays / maxLead) * 30;
    const ratingScore = (s.rating / 5) * 30;
    const total = priceScore + leadScore + ratingScore;
    if (total > bestScore) {
      bestScore = total;
      bestId = q.supplierId;
    }
  }
  return bestId;
}

type Q = { supplierId: string; pricePhp: number; leadTimeDays: number; deliveryFee?: number; deliveryMethod?: DeliveryMethod };

function pickCheapest(quotes: Q[]): string | null {
  const withPrice = quotes.filter((q) => q.pricePhp > 0);
  if (withPrice.length === 0) return null;
  return withPrice.reduce((a, b) => (a.pricePhp + (a.deliveryFee ?? 0) <= b.pricePhp + (b.deliveryFee ?? 0) ? a : b)).supplierId;
}
function pickByField(quotes: Q[], field: "leadTimeDays"): string | null {
  if (quotes.length === 0) return null;
  return quotes.reduce((a, b) => (a[field] <= b[field] ? a : b)).supplierId;
}

function sortQuotes<T extends Q>(quotes: T[], mode: "value" | "price" | "lead", bestId: string | null): T[] {
  const arr = [...quotes];
  if (mode === "price") arr.sort((a, b) => (a.pricePhp + (a.deliveryFee ?? 0)) - (b.pricePhp + (b.deliveryFee ?? 0)));
  else if (mode === "lead") arr.sort((a, b) => a.leadTimeDays - b.leadTimeDays);
  else arr.sort((a, b) => (a.supplierId === bestId ? -1 : b.supplierId === bestId ? 1 : (a.pricePhp || Infinity) - (b.pricePhp || Infinity)));
  return arr;
}

function deliveryLabel(m?: DeliveryMethod): string {
  if (m === "pickup") return "Pickup available";
  if (m === "carrier") return "3rd-party carrier";
  if (m === "supplier") return "Supplier delivery";
  return "Delivery TBD";
}

