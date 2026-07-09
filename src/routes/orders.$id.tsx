import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { EscrowTimeline } from "@/components/ui-bits";
import { orders, supplierById, productById, formatPhp, escrowSteps } from "@/lib/mock-data";
import type { Order, EscrowState } from "@/lib/mock-data";
import {
  MessageSquare, Truck, ShieldAlert, MapPin, CheckCircle2, Package, Warehouse,
  PackageCheck, Repeat, Star, X, Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useDemoOrder, saveDemoOrder, getDemoOrder, addToCart, type DemoOrder,
} from "@/lib/cart";

export const Route = createFileRoute("/orders/$id")({
  loader: ({ params }) => {
    const stored = getDemoOrder(params.id);
    if (stored) return { isDemo: true, orderId: params.id };
    const o = orders.find((x) => x.id === params.id);
    if (!o) throw notFound();
    return { isDemo: false, order: o };
  },
  head: ({ params }) => ({ meta: [{ title: `Order ${params.id} — PSG` }] }),
  notFoundComponent: () => (<AppShell><div className="p-20 text-center">Order not found</div></AppShell>),
  errorComponent: ({ reset }) => (<AppShell><div className="p-12 text-center"><button onClick={reset}>Retry</button></div></AppShell>),
  component: OrderDetail,
});

const FULFILL_STEPS: { state: EscrowState; label: string; icon: React.ReactNode; sub: string }[] = [
  { state: "Funds Held in Escrow", label: "Payment Received", icon: <CheckCircle2 size={16} />, sub: "Escrow secured" },
  { state: "Preparing Shipment", label: "Supplier Preparing", icon: <Package size={16} />, sub: "Picking & packing" },
  { state: "In Transit", label: "In Transit", icon: <Truck size={16} />, sub: "On the road" },
  { state: "Delivered — Awaiting Confirmation", label: "Delivered", icon: <Warehouse size={16} />, sub: "At your warehouse" },
  { state: "Released to Supplier", label: "Funds Released", icon: <PackageCheck size={16} />, sub: "Order complete" },
];

function OrderDetail() {
  const data = Route.useLoaderData() as
    | { isDemo: true; orderId: string }
    | { isDemo: false; order: Order };
  const navigate = useNavigate();
  const demo = useDemoOrder(data.isDemo ? data.orderId : "__none__");
  const o: Order | DemoOrder | undefined = data.isDemo ? demo : data.order;
  if (!o) return null;

  const s = supplierById(o.supplierId);
  const total = (o as DemoOrder).totalPhp ?? o.totalPhp;
  const isDemo = data.isDemo;

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // For demo orders, auto-advance through fulfillment states for visual effect.
  useEffect(() => {
    if (!isDemo || !demo) return;
    const order = demo as DemoOrder;
    const idx = FULFILL_STEPS.findIndex((s) => s.state === order.escrowState);
    if (idx < 0 || idx >= 3) return; // stop at "Delivered" — buyer must confirm
    const t = setTimeout(() => {
      saveDemoOrder({ ...order, escrowState: FULFILL_STEPS[idx + 1].state });
    }, 4500);
    return () => clearTimeout(t);
  }, [isDemo, demo]);

  // Open confirm modal once order auto-arrives at "Delivered"
  useEffect(() => {
    if (isDemo && demo?.escrowState === "Delivered — Awaiting Confirmation") {
      const t = setTimeout(() => setConfirmOpen(true), 1200);
      return () => clearTimeout(t);
    }
  }, [isDemo, demo?.escrowState]);

  const stepIdx = FULFILL_STEPS.findIndex((step) => step.state === o.escrowState);

  function handleConfirmYes() {
    if (!isDemo) return;
    setReleasing(true);
    setTimeout(() => {
      saveDemoOrder({ ...(demo as DemoOrder), escrowState: "Released to Supplier" });
      setConfirmOpen(false);
      setTimeout(() => {
        setReleasing(false);
        setShowReview(true);
      }, 1800);
    }, 600);
  }

  function handleReorder() {
    if (!o) return;
    o.items.forEach((it) => addToCart(it.productId, it.qty));
    navigate({ to: "/checkout" });
  }

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Link to="/orders" className="text-xs text-muted-foreground hover:text-primary">← All orders</Link>
          <div className="flex flex-wrap items-end justify-between gap-3 mt-2">
            <div>
              <h1 className="font-display text-3xl">Order {o.id.toUpperCase()}</h1>
              <div className="text-sm text-muted-foreground">Placed {o.placed} · with {s.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {o.escrowState === "Released to Supplier" ? "Released" : "Escrow holding"}
              </div>
              <div className="font-display text-3xl text-primary">{formatPhp(total)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          {/* Tracking map */}
          <TrackingMap stepIdx={stepIdx} dest={(o as DemoOrder).shippingDest ?? s.location} origin={s.location} />

          {/* Horizontal fulfillment progress */}
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Fulfillment progress</h2>
              <span className="chip chip-primary inline-flex items-center gap-1">
                <Truck size={12} /> Seller-fulfilled
              </span>
            </div>
            <ol className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {FULFILL_STEPS.map((step, i) => {
                const done = i < stepIdx;
                const current = i === stepIdx;
                return (
                  <li key={step.label} className="relative flex sm:flex-col items-center sm:text-center gap-2 sm:gap-0">
                    <div
                      className={`size-10 rounded-full grid place-items-center border-2 transition-all ${
                        done ? "bg-success border-success text-white"
                          : current ? "bg-primary border-primary text-white animate-pulse"
                          : "bg-background border-border text-muted-foreground"
                      }`}
                    >
                      {done ? <CheckCircle2 size={18} /> : step.icon}
                    </div>
                    <div className="sm:mt-2">
                      <div className={`text-xs font-semibold leading-tight ${current ? "text-primary" : done ? "" : "text-muted-foreground"}`}>
                        {step.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground hidden sm:block">{step.sub}</div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Escrow timeline */}
          <div className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold mb-4">Escrow timeline</h2>
            <EscrowTimeline state={o.escrowState} />
          </div>

          {/* Items */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b font-semibold">Items</div>
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr><th className="text-left px-4 py-2">Product</th><th className="text-right px-4 py-2">Qty</th><th className="text-right px-4 py-2">Unit</th><th className="text-right px-4 py-2">Total</th></tr>
              </thead>
              <tbody>
                {o.items.map((it: { productId: string; qty: number; price: number }, i: number) => {
                  const p = productById(it.productId);
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt="" className="size-12 rounded object-cover" />
                          <div>
                            <Link to="/products/$id" params={{ id: p.id }} className="font-medium hover:text-primary">{p.title}</Link>
                            <div className="text-xs text-muted-foreground">{p.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{it.qty}</td>
                      <td className="px-4 py-3 text-right">{formatPhp(it.price)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatPhp(it.qty * it.price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t bg-muted/40 text-sm space-y-1">
              {isDemo && (
                <>
                  <Row label="Subtotal" value={formatPhp((o as DemoOrder).subtotal)} />
                  <Row label="Shipping" value={formatPhp((o as DemoOrder).shippingCost)} />
                </>
              )}
              {!isDemo && <Row label="Subtotal" value={formatPhp(total)} />}
              <Row label="PSG escrow fee (3%)" value={formatPhp(Math.round(total * 0.03))} sub />
              <div className="flex items-center justify-between pt-2 border-t mt-2">
                <span className="font-semibold">{o.escrowState === "Released to Supplier" ? "Released to supplier" : "Held in escrow"}</span>
                <span className="font-display text-xl text-primary">{formatPhp(total + Math.round(total * 0.03))}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="grid sm:grid-cols-3 gap-3">
            {o.escrowState === "Delivered — Awaiting Confirmation" && (
              <button
                onClick={() => setConfirmOpen(true)}
                className="bg-success text-success-foreground font-semibold rounded-md py-3 hover:opacity-90"
              >
                ✓ Confirm delivery & release
              </button>
            )}
            {o.escrowState === "Released to Supplier" && (
              <>
                <button
                  onClick={handleReorder}
                  className="bg-primary text-primary-foreground font-semibold rounded-md py-3 hover:bg-primary/90 flex items-center justify-center gap-2"
                >
                  <Repeat size={16} /> Reorder Again
                </button>
                {!(o as DemoOrder).review && (
                  <button
                    onClick={() => setShowReview(true)}
                    className="border-2 border-gold text-foreground font-semibold rounded-md py-3 hover:bg-gold/5 flex items-center justify-center gap-2"
                  >
                    <Star size={16} /> Leave Review
                  </button>
                )}
              </>
            )}
            <Link to="/messages" className="border rounded-md py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-muted">
              <MessageSquare size={14} /> Message supplier
            </Link>
            <button className="border border-destructive/40 text-destructive rounded-md py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-destructive/5">
              <ShieldAlert size={14} /> Open a dispute
            </button>
          </div>

          {/* Big Reorder CTA at the end */}
          {o.escrowState === "Released to Supplier" && (
            <button
              onClick={handleReorder}
              className="w-full gradient-hero text-white rounded-lg py-6 flex items-center justify-center gap-3 hover:opacity-95 shadow-lg group"
            >
              <Repeat size={22} className="group-hover:rotate-180 transition-transform duration-500" />
              <span className="font-display text-2xl">Reorder Again</span>
              <span className="text-sm opacity-80">— same items, same supplier</span>
            </button>
          )}

          {(o as DemoOrder).review && <ReviewSummary r={(o as DemoOrder).review!} />}
        </div>

        {/* Side */}
        <aside className="space-y-4">
          <Link to="/suppliers/$id" params={{ id: s.id }} className="block rounded-lg border bg-card p-4 hover:shadow-md">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Supplier</div>
            <div className="font-semibold">{s.name}</div>
            <div className="text-xs text-muted-foreground">{s.location}</div>
            <div className="text-xs mt-2">Response time: {s.responseTime}</div>
          </Link>

          <div className="rounded-lg border bg-card p-4 text-sm space-y-1">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Delivery to</div>
            <div className="font-medium">{(o as DemoOrder).address?.business ?? "Lola Nena's Commissary"}</div>
            <div className="text-muted-foreground text-xs">{(o as DemoOrder).address?.address ?? "14 Roces Ave, Project 8, Quezon City"}</div>
            {(o as DemoOrder).address?.phone && (
              <div className="text-muted-foreground text-xs">{(o as DemoOrder).address.phone}</div>
            )}
          </div>

          {isDemo && (
            <div className="rounded-lg border bg-card p-4 text-sm">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Payment method</div>
              <div className="font-medium capitalize">{(o as DemoOrder).payment}</div>
            </div>
          )}

          <div className="rounded-lg gradient-ink text-white p-4 text-sm">
            <div className="text-xs uppercase tracking-wider text-[oklch(0.78_0.15_75)] font-semibold mb-2">Escrow protection</div>
            <p className="opacity-90">Funds are held by PSG until you confirm delivery. Open a dispute within 72 hours if there's an issue — we'll mediate.</p>
          </div>
        </aside>
      </div>

      {confirmOpen && (
        <ConfirmDeliveryModal
          onYes={handleConfirmYes}
          onNo={() => setConfirmOpen(false)}
        />
      )}
      {releasing && <ReleaseAnimation />}
      {showReview && (
        <ReviewModal
          onClose={() => setShowReview(false)}
          onSubmit={(r) => {
            if (isDemo) saveDemoOrder({ ...(demo as DemoOrder), review: r });
            setShowReview(false);
          }}
        />
      )}
    </AppShell>
  );
}

function TrackingMap({ stepIdx, dest, origin }: { stepIdx: number; dest: string; origin: string }) {
  // Position truck along an SVG path based on stepIdx (0..4)
  const progress = Math.max(0, Math.min(1, stepIdx / (FULFILL_STEPS.length - 1)));
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="font-semibold flex items-center gap-2"><MapPin size={16} className="text-primary" /> Live tracking</div>
        <span className="text-xs text-muted-foreground">{origin} → {dest}</span>
      </div>
      <div className="relative h-56 bg-gradient-to-br from-[oklch(0.95_0.04_180)] via-[oklch(0.96_0.02_90)] to-[oklch(0.93_0.04_60)] overflow-hidden">
        {/* faux map grid */}
        <svg className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="oklch(0.4 0.05 60)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* route line */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 220" preserveAspectRatio="none">
          <path
            d="M 40 170 C 160 150, 220 60, 320 100 S 500 180, 560 50"
            fill="none"
            stroke="oklch(0.58 0.22 27 / 0.25)"
            strokeWidth="4"
            strokeDasharray="6 6"
          />
          <path
            id="route"
            d="M 40 170 C 160 150, 220 60, 320 100 S 500 180, 560 50"
            fill="none"
            stroke="oklch(0.58 0.22 27)"
            strokeWidth="3"
            pathLength={1}
            strokeDasharray={`${progress} 1`}
          />
          {/* origin pin */}
          <circle cx="40" cy="170" r="7" fill="oklch(0.62 0.16 150)" />
          <circle cx="40" cy="170" r="3" fill="white" />
          {/* dest pin */}
          <circle cx="560" cy="50" r="9" fill="oklch(0.58 0.22 27)" />
          <circle cx="560" cy="50" r="4" fill="white" />
        </svg>
        {/* truck */}
        <div
          className="absolute transition-all duration-1000 ease-out"
          style={{ left: `${5 + progress * 88}%`, top: `${72 - progress * 50}%` }}
        >
          <div className="bg-primary text-white rounded-full p-2 shadow-lg animate-bounce">
            <Truck size={20} />
          </div>
        </div>
        {/* labels */}
        <div className="absolute bottom-2 left-3 text-xs font-semibold text-foreground/80 bg-white/70 px-2 py-0.5 rounded">📍 {origin}</div>
        <div className="absolute top-2 right-3 text-xs font-semibold text-foreground/80 bg-white/70 px-2 py-0.5 rounded">🏁 {dest}</div>
      </div>
      <div className="px-4 py-2 bg-muted/40 text-xs flex items-center justify-between">
        <span className="font-medium">{FULFILL_STEPS[Math.max(0, stepIdx)]?.label}</span>
        <span className="text-muted-foreground">{Math.round(progress * 100)}% of route complete</span>
      </div>
    </div>
  );
}

function ConfirmDeliveryModal({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 grid place-items-center p-4 animate-fade-in">
      <div className="bg-card rounded-xl max-w-md w-full p-6 text-center shadow-2xl animate-scale-in">
        <div className="size-16 rounded-full bg-gold/15 grid place-items-center mx-auto mb-3">
          <PackageCheck size={32} className="text-gold" />
        </div>
        <h2 className="font-display text-2xl">Did you receive your order?</h2>
        <p className="text-sm text-muted-foreground mt-1">Confirming delivery releases escrow funds to the supplier.</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={onNo} className="border-2 rounded-md py-3 font-semibold hover:bg-muted">No, not yet</button>
          <button onClick={onYes} className="bg-success text-success-foreground rounded-md py-3 font-semibold hover:opacity-90">
            ✓ Yes, received
          </button>
        </div>
        <button onClick={onNo} className="mt-3 text-xs text-muted-foreground hover:underline">Report an issue instead</button>
      </div>
    </div>
  );
}

function ReleaseAnimation() {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 grid place-items-center animate-fade-in">
      <div className="text-center text-white">
        <div className="size-28 mx-auto rounded-full bg-success/20 border-4 border-success grid place-items-center mb-4 animate-scale-in">
          <Sparkles size={56} className="text-gold animate-pulse" />
        </div>
        <div className="font-display text-4xl">Payment Released</div>
        <div className="text-sm opacity-80 mt-1">Funds successfully transferred to supplier</div>
      </div>
    </div>
  );
}

function ReviewModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (r: NonNullable<DemoOrder["review"]>) => void }) {
  const [rating, setRating] = useState(5);
  const [quality, setQuality] = useState(5);
  const [packaging, setPackaging] = useState(5);
  const [delivery, setDelivery] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [comment, setComment] = useState("");
  return (
    <div className="fixed inset-0 bg-black/60 z-50 grid place-items-center p-4 animate-fade-in overflow-y-auto">
      <div className="bg-card rounded-xl max-w-lg w-full shadow-2xl animate-scale-in my-8">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="font-display text-2xl">Rate this order</div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-center">
            <Stars value={rating} onChange={setRating} large />
            <div className="text-xs text-muted-foreground mt-1">Overall rating</div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Bucket label="Product Quality" value={quality} onChange={setQuality} />
            <Bucket label="Packaging" value={packaging} onChange={setPackaging} />
            <Bucket label="Delivery" value={delivery} onChange={setDelivery} />
            <Bucket label="Communication" value={communication} onChange={setCommunication} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comments</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell other buyers about this supplier…"
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-card min-h-[88px]"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-sm font-semibold hover:bg-muted">Skip</button>
          <button
            onClick={() => onSubmit({ rating, quality, packaging, delivery, communication, comment })}
            className="bg-primary text-white px-5 py-2 rounded-md font-semibold hover:bg-primary/90"
          >
            Submit Review
          </button>
        </div>
      </div>
    </div>
  );
}

function Bucket({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div className="border rounded-md px-3 py-2 flex items-center justify-between">
      <span className="text-xs font-medium">{label}</span>
      <Stars value={value} onChange={onChange} />
    </div>
  );
}

function Stars({ value, onChange, large }: { value: number; onChange: (n: number) => void; large?: boolean }) {
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} type="button">
          <Star
            size={large ? 32 : 16}
            className={n <= value ? "fill-[oklch(0.78_0.15_75)] text-[oklch(0.78_0.15_75)]" : "text-muted-foreground"}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewSummary({ r }: { r: NonNullable<DemoOrder["review"]> }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Your review</h2>
        <Stars value={r.rating} onChange={() => {}} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {[
          ["Quality", r.quality], ["Packaging", r.packaging],
          ["Delivery", r.delivery], ["Communication", r.communication],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded bg-muted/40 p-2 text-center">
            <div className="text-muted-foreground uppercase">{k}</div>
            <div className="font-semibold text-base">{v}/5</div>
          </div>
        ))}
      </div>
      {r.comment && <p className="mt-3 text-sm italic text-muted-foreground">"{r.comment}"</p>}
    </div>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${sub ? "text-xs text-muted-foreground" : ""}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
