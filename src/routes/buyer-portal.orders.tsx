import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { orders as MOCK, supplierById, formatPhp, productById } from "@/lib/mock-data";
import { seedDemoDeliveries, useAllDeliveries, DELIVERY_METHOD_BADGES } from "@/lib/delivery";

export const Route = createFileRoute("/buyer-portal/orders")({
  component: BuyerOrdersTab,
});

function BuyerOrdersTab() {
  useEffect(() => { seedDemoDeliveries(); }, []);
  const deliveries = useAllDeliveries();
  const [q, setQ] = useState("");
  const rows = MOCK.filter((o) => !q || o.id.toLowerCase().includes(q.toLowerCase()) || supplierById(o.supplierId).name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-lg">Orders ({rows.length})</h2>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order or supplier…" className="border rounded px-3 py-1.5 text-sm bg-card min-w-64" />
      </div>
      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/40">
            <tr>
              <th className="text-left px-4 py-2.5">Order</th>
              <th className="text-left px-2">Supplier</th>
              <th className="text-left px-2">Product</th>
              <th className="text-right px-2">Amount</th>
              <th className="text-left px-2">Delivery Method</th>
              <th className="text-left px-2">Payment</th>
              <th className="text-left px-2">Order Status</th>
              <th className="text-right px-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const s = supplierById(o.supplierId);
              const p = productById(o.items[0]?.productId);
              const d = deliveries[o.id];
              return (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{o.id.toUpperCase()}</td>
                  <td className="px-2">{s.name}</td>
                  <td className="px-2 text-muted-foreground truncate max-w-[200px]">{p?.title}</td>
                  <td className="px-2 text-right font-semibold text-primary">{formatPhp(o.totalPhp)}</td>
                  <td className="px-2"><span className="chip">{d ? DELIVERY_METHOD_BADGES[d.method] : "Not set"}</span></td>
                  <td className="px-2"><span className="chip chip-verified">Payment Protected</span></td>
                  <td className="px-2"><span className="chip">{o.escrowState}</span></td>
                  <td className="px-4 text-right">
                    <Link to="/orders/$id" params={{ id: o.id }} className="text-primary text-xs font-semibold">View Order →</Link>
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
