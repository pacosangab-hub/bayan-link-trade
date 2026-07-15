import { createFileRoute, Link } from "@tanstack/react-router";
import { orders as MOCK, supplierById, productById, formatPhp } from "@/lib/mock-data";

export const Route = createFileRoute("/buyer-portal/reorders")({
  component: BuyerReorders,
});

function BuyerReorders() {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Reorder Favorites</h2>
      <p className="text-sm text-muted-foreground">Repeat a past order in one click.</p>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {MOCK.map((o) => {
          const s = supplierById(o.supplierId);
          const p = productById(o.items[0]?.productId);
          return (
            <div key={o.id} className="border rounded-lg p-4 bg-card">
              <div className="text-xs text-muted-foreground">Last ordered · {o.placed}</div>
              <div className="font-semibold mt-1">{p?.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.name} · {s.location}</div>
              <div className="mt-2 text-sm font-semibold text-primary">{formatPhp(o.totalPhp)}</div>
              <div className="mt-3 flex gap-2">
                <Link to="/products/$id" params={{ id: p?.id || "" }} className="flex-1 inline-flex justify-center bg-primary text-primary-foreground rounded text-xs font-semibold py-2">Reorder</Link>
                <Link to="/orders/$id" params={{ id: o.id }} className="inline-flex justify-center border rounded text-xs font-semibold py-2 px-3">View</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
