import { createFileRoute, Link } from "@tanstack/react-router";
import { products, supplierById, formatPhp } from "@/lib/mock-data";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/buyer-portal/reorders")({
  component: BuyerReordersPage,
});

const REORDERS = [
  { productId: "prod_001", lastQty: 40, lastDate: "14 days ago" },
  { productId: "prod_002", lastQty: 200, lastDate: "3 weeks ago" },
  { productId: "prod_003", lastQty: 24, lastDate: "1 month ago" },
  { productId: "prod_004", lastQty: 60, lastDate: "6 weeks ago" },
  { productId: "prod_005", lastQty: 12, lastDate: "2 months ago" },
];

function BuyerReordersPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Reorder Favorites</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {REORDERS.map((r, i) => {
          const p = products.find((x) => x.id === r.productId) || products[i % products.length];
          const s = supplierById(p.supplierId);
          const price = p.pricePhp * r.lastQty;
          return (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground">Last ordered {r.lastDate}</div>
              <div className="font-medium text-sm mt-1 line-clamp-2">{p.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.name}</div>
              <dl className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div><span className="text-muted-foreground">Qty:</span> <span className="font-semibold">{r.lastQty} {p.unit}</span></div>
                <div><span className="text-muted-foreground">Price:</span> <span className="font-semibold text-primary">{formatPhp(price)}</span></div>
              </dl>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => toast.success(`Reorder started for ${p.title}`)}
                  className="inline-flex items-center justify-center gap-1 text-xs font-semibold bg-primary text-primary-foreground rounded py-1.5"
                >
                  <RefreshCw size={12} /> Reorder
                </button>
                <Link to="/rfq/new" className="text-xs font-semibold border rounded py-1.5 text-center">
                  Request Updated Quote
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
