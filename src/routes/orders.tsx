import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { orders, supplierById, formatPhp } from "@/lib/mock-data";

const stateColors: Record<string, string> = {
  "Awaiting Supplier Acceptance": "chip-primary",
  "Funds Held in Escrow": "chip-gold",
  "Preparing Shipment": "chip-gold",
  "In Transit": "chip-gold",
  "Delivered — Awaiting Confirmation": "chip-primary",
  "Released to Supplier": "chip-verified",
  "Disputed": "",
};

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders — PSG" }] }),
  component: OrdersList,
});

function OrdersList() {
  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">Orders</h1>
            <p className="text-sm text-muted-foreground">All orders, escrow-protected end to end.</p>
          </div>
          <Link to="/products" className="border bg-card rounded-md px-4 py-2 text-sm font-semibold">Place a new order</Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Supplier</th>
                <th className="text-left px-4 py-3">Placed</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Escrow status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const s = supplierById(o.supplierId);
                return (
                  <tr key={o.id} className="border-t hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-xs">{o.id.toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.location}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{o.placed}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatPhp(o.totalPhp)}</td>
                    <td className="px-4 py-3">
                      <span className={`chip ${stateColors[o.escrowState] ?? ""}`}>{o.escrowState}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/orders/$id" params={{ id: o.id }} className="text-primary font-semibold text-xs">
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
