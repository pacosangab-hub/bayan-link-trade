import { createFileRoute, Link } from "@tanstack/react-router";
import { orders, formatPhp, supplierById } from "@/lib/mock-data";

export const Route = createFileRoute("/supplier-portal/orders")({
  component: SupplierOrdersPage,
});

function SupplierOrdersPage() {
  const myOrders = orders.filter((o) => o.supplierId === "sup_001" || true).slice(0, 8);
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Orders ({myOrders.length})</h2>
      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/40">
            <tr>
              <th className="text-left px-4 py-2.5">Order #</th>
              <th className="text-left px-2">Buyer</th>
              <th className="text-left px-2">Supplier</th>
              <th className="text-right px-2">Amount</th>
              <th className="text-left px-2">Escrow</th>
              <th className="text-right px-4"></th>
            </tr>
          </thead>
          <tbody>
            {myOrders.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-mono text-xs">{o.id.toUpperCase()}</td>
                <td className="px-2">{o.buyer}</td>
                <td className="px-2 text-xs text-muted-foreground">{supplierById(o.supplierId)?.name}</td>
                <td className="px-2 text-right font-semibold text-primary">{formatPhp(o.totalPhp)}</td>
                <td className="px-2"><span className="chip">{o.escrowState}</span></td>
                <td className="px-4 text-right">
                  <Link to="/orders/$id" params={{ id: o.id }} className="text-primary text-xs font-semibold">View Order →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
