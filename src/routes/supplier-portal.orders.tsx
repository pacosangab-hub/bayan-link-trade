import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { orders, products, formatPhp } from "@/lib/mock-data";
import { seedDemoDeliveries, useAllDeliveries, DELIVERY_METHOD_BADGES } from "@/lib/delivery";

export const Route = createFileRoute("/supplier-portal/orders")({
  component: SupplierOrdersPage,
});

function SupplierOrdersPage() {
  useEffect(() => { seedDemoDeliveries(); }, []);
  const deliveries = useAllDeliveries();
  const myOrders = orders.slice(0, 8);
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Orders ({myOrders.length})</h2>
      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/40">
            <tr>
              <th className="text-left px-4 py-2.5">Order</th>
              <th className="text-left px-2">Buyer</th>
              <th className="text-left px-2">Product</th>
              <th className="text-right px-2">Amount</th>
              <th className="text-left px-2">Delivery</th>
              <th className="text-left px-2">Status</th>
              <th className="text-right px-4"></th>
            </tr>
          </thead>
          <tbody>
            {myOrders.map((o) => {
              const first = o.items[0];
              const product = products.find((p) => p.id === first?.productId);
              const d = deliveries[o.id];
              return (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{o.id.toUpperCase()}</td>
                  <td className="px-2">{o.buyer}</td>
                  <td className="px-2 text-xs text-muted-foreground truncate max-w-[220px]">{product?.title ?? "—"}</td>
                  <td className="px-2 text-right font-semibold text-primary">{formatPhp(o.totalPhp)}</td>
                  <td className="px-2"><span className="chip">{d ? DELIVERY_METHOD_BADGES[d.method] : "Not set"}</span></td>
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
