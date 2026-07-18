import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { orders as mockOrders, supplierById, formatPhp } from "@/lib/mock-data";
import { useDemoOrders } from "@/lib/cart";

const stateColors: Record<string, string> = {
  "Awaiting Supplier Acceptance": "chip-primary",
  "Funds Held in Escrow": "chip-gold",
  "Preparing Shipment": "chip-gold",
  "In Transit": "chip-gold",
  "Delivered — Awaiting Confirmation": "chip-primary",
  "Released to Supplier": "chip-verified",
  "Disputed": "",
};

export const Route = createFileRoute("/orders/")({
  head: () => ({ meta: [{ title: "Orders — PSG" }] }),
  component: OrdersList,
});

function OrdersList() {
  const demoOrders = useDemoOrders();
  const demoIds = new Set(demoOrders.map((order) => order.id));
  const rows = [...demoOrders, ...mockOrders.filter((order) => !demoIds.has(order.id))];

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
                <th className="text-left px-4 py-3">Delivery</th>
                <th className="text-right px-4 py-3">Amount</th>
                <th className="text-left px-4 py-3">Escrow status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => {
                const supplier = supplierById(order.supplierId);
                const anyOrder = order as typeof order & { deliveryDetails?: { label: string; eta?: string } };
                const delivery = anyOrder.deliveryDetails;
                return (
                  <tr key={order.id} className="border-t hover:bg-muted/40">
                    <td className="px-4 py-3 font-mono text-xs">{order.id.toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{supplier.name}</div>
                      <div className="text-xs text-muted-foreground">{supplier.location}</div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{order.placed}</td>
                    <td className="px-4 py-3">
                      {delivery ? (
                        <>
                          <div className="text-xs font-medium">{delivery.label}</div>
                          {delivery.eta && <div className="text-[10px] text-muted-foreground">{delivery.eta}</div>}
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{formatPhp(order.totalPhp)}</td>
                    <td className="px-4 py-3">
                      <span className={`chip ${stateColors[order.escrowState] ?? ""}`}>{order.escrowState}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to="/orders/$id" params={{ id: order.id }} className="text-primary font-semibold text-xs">
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