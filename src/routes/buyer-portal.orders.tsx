import { createFileRoute, Link } from "@tanstack/react-router";
import { orders, products, supplierById, formatPhp } from "@/lib/mock-data";

export const Route = createFileRoute("/buyer-portal/orders")({
  component: BuyerOrdersPage,
});

function BuyerOrdersPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Orders ({orders.length})</h2>
      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-[11px] uppercase text-muted-foreground border-b bg-muted/40">
            <tr>
              <th className="text-left px-4 py-2.5">Order</th>
              <th className="text-left px-2">Supplier</th>
              <th className="text-left px-2">Product</th>
              <th className="text-right px-2">Amount</th>
              <th className="text-left px-2">Payment</th>
              <th className="text-left px-2">Order Status</th>
              <th className="text-right px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((o) => {
              const s = supplierById(o.supplierId);
              const first = o.items[0];
              const prod = products.find((p) => p.id === first?.productId);
              return (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-mono text-xs">{o.id.toUpperCase()}</td>
                  <td className="px-2">{s.name}</td>
                  <td className="px-2 text-xs text-muted-foreground truncate max-w-[220px]">{prod?.title ?? "—"}</td>
                  <td className="px-2 text-right font-semibold text-primary">{formatPhp(o.totalPhp)}</td>
                  <td className="px-2"><span className="chip chip-verified">Protected</span></td>
                  <td className="px-2"><span className="chip">{o.escrowState}</span></td>
                  <td className="px-4 text-right">
                    <Link to="/orders/$id" params={{ id: o.id }} className="text-primary text-xs font-semibold">View →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
