import { Star, ShieldCheck, BadgeCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Product, Supplier, RFQ, EscrowState, RFQStatus } from "@/lib/mock-data";
import { formatPhp, supplierById, escrowSteps } from "@/lib/mock-data";

export function statusChipClass(s: RFQStatus): string {
  switch (s) {
    case "Open":
    case "Receiving Quotes":
      return "chip-verified";
    case "Awaiting Decision":
      return "chip-primary";
    case "Supplier Selected":
    case "Order Created":
    case "Completed":
    case "Awarded":
      return "chip-gold";
    default:
      return "";
  }
}


export function VerifiedBadge({ gold = false }: { gold?: boolean }) {
  return gold ? (
    <span className="chip chip-gold">
      <BadgeCheck size={12} /> Gold Supplier
    </span>
  ) : (
    <span className="chip chip-verified">
      <ShieldCheck size={12} /> Verified
    </span>
  );
}

export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star size={14} className="fill-[oklch(0.78_0.15_75)] text-[oklch(0.78_0.15_75)]" />
      <span className="font-semibold">{value.toFixed(1)}</span>
      {count !== undefined && <span className="text-muted-foreground text-xs">({count})</span>}
    </span>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const s = supplierById(p.supplierId);
  return (
    <Link
      to="/products/$id"
      params={{ id: p.id }}
      className="group block cursor-pointer rounded-lg border bg-card overflow-hidden hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="aspect-[4/3] overflow-hidden bg-muted">
        <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="font-display text-xl text-primary leading-none">{formatPhp(p.pricePhp)}</div>
          <div className="text-xs text-muted-foreground">/ {p.unit}</div>
        </div>
        <div className="text-sm font-medium line-clamp-2 min-h-[2.5rem]">{p.title}</div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>MOQ {p.moq} {p.unit}</span>
          <Rating value={s.rating} />
        </div>
        <div className="flex items-center gap-1.5 pt-1.5 border-t mt-2">
          <span className="text-xs truncate text-foreground/80">{s.name}</span>
          {s.verified && <ShieldCheck size={12} className="text-success shrink-0" />}
        </div>
      </div>
    </Link>
  );
}

export function SupplierCard({ s }: { s: Supplier }) {
  return (
    <Link
      to="/suppliers/$id"
      params={{ id: s.id }}
      className="rounded-lg border bg-card overflow-hidden hover:shadow-md transition-all flex flex-col"
    >
      <div className="aspect-[16/7] bg-muted overflow-hidden">
        <img src={s.cover} alt={s.name} className="w-full h-full object-cover" />
      </div>
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-semibold leading-tight">{s.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {s.type} · {s.location}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {s.verified && <VerifiedBadge />}
          {s.goldSupplier && <VerifiedBadge gold />}
          <span className="chip">{s.yearsOperating} yrs</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{s.description}</p>
        <div className="mt-auto pt-2 border-t flex items-center justify-between text-xs">
          <Rating value={s.rating} count={s.reviews} />
          <span className="text-muted-foreground">{s.transactions.toLocaleString()} orders</span>
        </div>
      </div>
    </Link>
  );
}

export function RFQCard({ r }: { r: RFQ }) {
  return (
    <Link
      to="/rfq/$id"
      params={{ id: r.id }}
      className="block rounded-lg border bg-card p-4 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="chip chip-primary">{r.category}</span>
            <span className={`chip ${statusChipClass(r.status)}`}>{r.status}</span>
          </div>

          <h3 className="font-semibold leading-snug">{r.title}</h3>
          <div className="text-xs text-muted-foreground mt-1">
            {r.buyer} · {r.buyerType}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground">{r.postedAgo}</div>
          <div className="text-xs mt-1 font-medium">{r.responses} quotes</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <Stat label="Quantity" value={r.qty} />
        <Stat label="Budget" value={r.budgetPhp} />
        <Stat label="Deliver by" value={r.deliverBy} />
        <Stat label="Region" value={r.region} />
      </div>
    </Link>
  );
}

export function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-muted/60 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium truncate">{value}</div>
    </div>
  );
}

export function EscrowTimeline({ state }: { state: EscrowState }) {
  const idx = escrowSteps.indexOf(state);
  const disputed = state === "Disputed";
  return (
    <ol className="space-y-3">
      {escrowSteps.map((step, i) => {
        const done = !disputed && i < idx;
        const current = !disputed && i === idx;
        return (
          <li key={step} className="flex gap-3 items-start">
            <div
              className={`mt-0.5 size-6 rounded-full grid place-items-center text-xs font-bold border-2 ${
                done
                  ? "bg-success border-success text-white"
                  : current
                  ? "bg-primary border-primary text-white animate-pulse"
                  : "bg-background border-border text-muted-foreground"
              }`}
            >
              {done ? "✓" : i + 1}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-medium ${current ? "text-primary" : done ? "" : "text-muted-foreground"}`}>
                {step}
              </div>
              {current && <div className="text-xs text-muted-foreground mt-0.5">Current status</div>}
            </div>
          </li>
        );
      })}
      {disputed && (
        <li className="rounded-md bg-destructive/10 text-destructive p-3 text-sm font-medium">
          ⚠ Order disputed — PSG admin reviewing
        </li>
      )}
    </ol>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        {eyebrow && (
          <div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-1">
            {eyebrow}
          </div>
        )}
        <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  );
}
