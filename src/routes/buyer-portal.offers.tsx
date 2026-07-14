import { createFileRoute, Link } from "@tanstack/react-router";
import { products, supplierById, formatPhp } from "@/lib/mock-data";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/buyer-portal/offers")({
  component: BuyerOffersPage,
});

// Demo offers driven off mock products.
const OFFERS = [
  { productId: "prod_001", qty: 40, unit: "sacks", unitPrice: 1450, delivery: 1500, leadDays: 3, validUntil: "in 3 days" },
  { productId: "prod_002", qty: 80, unit: "boxes", unitPrice: 380, delivery: 800, leadDays: 5, validUntil: "in 5 days" },
  { productId: "prod_003", qty: 20, unit: "gallons", unitPrice: 620, delivery: 500, leadDays: 2, validUntil: "in 2 days" },
];

function BuyerOffersPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Supplier Offers ({OFFERS.length})</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {OFFERS.map((o, i) => {
          const p = products.find((x) => x.id === o.productId) || products[i % products.length];
          const s = supplierById(p.supplierId);
          const total = o.unitPrice * o.qty + o.delivery;
          return (
            <div key={i} className="rounded-lg border bg-card p-4 flex flex-col">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold">{s.name}</span>
                {s.verified && <span className="chip chip-verified">Verified</span>}
              </div>
              <div className="font-medium mt-2 text-sm line-clamp-2">{p.title}</div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Row label="Quantity" value={`${o.qty} ${o.unit}`} />
                <Row label="Unit Price" value={formatPhp(o.unitPrice)} />
                <Row label="Delivery Fee" value={formatPhp(o.delivery)} />
                <Row label="Lead Time" value={`${o.leadDays} days`} />
                <Row label="Valid Until" value={o.validUntil} />
                <Row label="Total" value={formatPhp(total)} strong />
              </dl>
              <div className="mt-3 inline-flex items-center gap-1 text-[11px] text-success font-semibold">
                <ShieldCheck size={12} /> Protected payment available
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button className="text-xs font-semibold bg-primary text-primary-foreground rounded py-1.5">Accept</button>
                <button className="text-xs font-semibold border rounded py-1.5">Changes</button>
                <button className="text-xs font-semibold border rounded py-1.5">Decline</button>
              </div>
              <Link to="/offers" className="text-xs text-primary font-semibold mt-2 text-center">Open offer details →</Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className={strong ? "font-semibold text-primary" : ""}>{value}</div>
    </div>
  );
}
