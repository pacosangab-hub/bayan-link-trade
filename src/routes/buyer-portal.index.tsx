import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { orders as MOCK_ORDERS, supplierById, formatPhp, rfqs, productById } from "@/lib/mock-data";
import { seedDemoDeliveries, useAllDeliveries, DELIVERY_METHOD_BADGES, DELIVERY_STATUS_LABELS, deliveryStatusTone } from "@/lib/delivery";
import { getAllOffers } from "@/lib/offers-store";
import { FileText, Store, RotateCcw, Package, Wallet, MessageSquare, MapPin, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/buyer-portal/")({
  component: BuyerOverview,
});

function BuyerOverview() {
  useEffect(() => { seedDemoDeliveries(); }, []);
  const deliveries = useAllDeliveries();

  const activeOrders = MOCK_ORDERS.slice(0, 5);
  const openRequests = rfqs.filter((r) => r.status === "Open").length || 4;
  const offerCount = (() => { try { return getAllOffers().length || 7; } catch { return 7; } })();
  const activeCount = activeOrders.filter((o) => o.escrowState !== "Released to Supplier").length;
  const protectedSum = activeOrders.filter((o) => o.escrowState !== "Released to Supplier").reduce((a, o) => a + o.totalPhp, 0);

  const attention = useMemo(() => [
    { label: `${offerCount} supplier offers waiting for your decision`, to: "/buyer-portal/offers", action: "Review Offers" },
    { label: "Order ORD_23994 is ready for pickup — confirm collection", to: "/orders/$id", params: { id: "ord_23994" }, action: "Confirm Delivery" },
    { label: `${openRequests} quote requests waiting for supplier replies`, to: "/buyer-portal/quote-requests", action: "View Requests" },
    { label: "Delivery method needs confirmation on 1 order", to: "/buyer-portal/deliveries", action: "Choose Delivery Method" },
  ], [offerCount, openRequests]);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <section className="grid md:grid-cols-3 gap-3">
        <QuickAction icon={<FileText size={18} />} title="Post Quote Request" text="Tell suppliers what you need and receive offers." cta="Post Request" to="/rfq/new" />
        <QuickAction icon={<Store size={18} />} title="Browse Verified Suppliers" text="Find trusted suppliers by category and location." cta="Browse Suppliers" to="/suppliers" />
        <QuickAction icon={<RotateCcw size={18} />} title="Reorder Supplies" text="Repeat a past order quickly." cta="View Reorders" to="/buyer-portal/reorders" />
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric icon={<FileText size={16} />} label="Open Requests" value={String(openRequests)} />
        <Metric icon={<MessageSquare size={16} />} label="Supplier Offers" value={String(offerCount)} />
        <Metric icon={<Package size={16} />} label="Active Orders" value={String(activeCount)} />
        <Metric icon={<Wallet size={16} />} label="Protected Payments" value={formatPhp(protectedSum)} />
      </section>

      {/* Needs Attention */}
      <section className="rounded-lg border bg-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle size={16} className="text-primary" />
          <h2 className="font-semibold">Needs Attention</h2>
        </div>
        <ul className="divide-y">
          {attention.map((a, i) => (
            <li key={i} className="flex items-center justify-between py-2.5 gap-3">
              <span className="text-sm">{a.label}</span>
              {a.params ? (
                <Link to={a.to as any} params={a.params as any} className="text-xs px-3 py-1.5 rounded border font-semibold hover:bg-muted whitespace-nowrap">{a.action}</Link>
              ) : (
                <Link to={a.to as any} className="text-xs px-3 py-1.5 rounded border font-semibold hover:bg-muted whitespace-nowrap">{a.action}</Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Active Orders */}
      <section className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Active Orders</h2>
          <Link to="/buyer-portal/orders" className="text-xs text-primary font-semibold">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b">
              <tr>
                <th className="text-left py-2">Order</th>
                <th className="text-left px-2">Supplier</th>
                <th className="text-left px-2">Product</th>
                <th className="text-right px-2">Amount</th>
                <th className="text-left px-2">Delivery</th>
                <th className="text-left px-2">Status</th>
                <th className="text-right"></th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map((o) => {
                const s = supplierById(o.supplierId);
                const p = productById(o.items[0]?.productId);
                const d = deliveries[o.id];
                return (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="py-2.5 font-mono text-xs">{o.id.toUpperCase()}</td>
                    <td className="px-2">{s?.name}</td>
                    <td className="px-2 text-xs text-muted-foreground truncate max-w-[180px]">{p?.title}</td>
                    <td className="px-2 text-right font-semibold">{formatPhp(o.totalPhp)}</td>
                    <td className="px-2"><span className="chip">{d ? DELIVERY_METHOD_BADGES[d.method] : "—"}</span></td>
                    <td className="px-2"><span className="chip">{o.escrowState}</span></td>
                    <td className="text-right">
                      <Link to="/orders/$id" params={{ id: o.id }} className="text-primary text-xs font-semibold">View →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Delivery Updates */}
      <section className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Delivery Updates</h2>
          <Link to="/buyer-portal/deliveries" className="text-xs text-primary font-semibold">View all →</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {Object.entries(deliveries).slice(0, 3).map(([id, d]) => {
            const order = MOCK_ORDERS.find((o) => o.id === id);
            const s = order ? supplierById(order.supplierId) : null;
            return (
              <div key={id} className="border rounded-md p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs">{id.toUpperCase()}</span>
                  <span className={`chip ${deliveryStatusTone(d.status)}`}>{DELIVERY_STATUS_LABELS[d.status]}</span>
                </div>
                <div className="text-sm font-medium">{s?.name || "Supplier"}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={12} /> {DELIVERY_METHOD_BADGES[d.method]}</div>
                {d.details.eta && <div className="text-xs">ETA: <b>{d.details.eta}</b></div>}
                {d.details.tracking_number && <div className="text-xs">Tracking: <code>{d.details.tracking_number}</code></div>}
                <Link to="/orders/$id" params={{ id }} className="mt-1 inline-block text-xs text-primary font-semibold">View order →</Link>
              </div>
            );
          })}
          {Object.keys(deliveries).length === 0 && (
            <div className="col-span-3 text-sm text-muted-foreground py-6 text-center border-2 border-dashed rounded-md">No active deliveries yet.</div>
          )}
        </div>
      </section>

      {/* Reorder Favorites */}
      <section className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Reorder Favorites</h2>
          <Link to="/buyer-portal/reorders" className="text-xs text-primary font-semibold">View all →</Link>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
          {activeOrders.slice(0, 4).map((o) => {
            const p = productById(o.items[0]?.productId);
            return (
              <div key={o.id} className="border rounded-md p-3">
                <div className="text-xs text-muted-foreground">Last ordered · {o.placed}</div>
                <div className="font-medium text-sm mt-1 truncate">{p?.title}</div>
                <Link to="/products/$id" params={{ id: p?.id || "" }} className="mt-2 w-full inline-flex justify-center bg-primary text-primary-foreground rounded text-xs font-semibold py-1.5">
                  Reorder
                </Link>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function QuickAction({ icon, title, text, cta, to }: any) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center mb-3">{icon}</div>
      <div className="font-semibold">{title}</div>
      <p className="text-xs text-muted-foreground mt-1">{text}</p>
      <Link to={to} className="mt-3 inline-flex text-xs font-semibold text-primary">{cta} →</Link>
    </div>
  );
}

function Metric({ icon, label, value }: any) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <div className="text-xs uppercase tracking-wider font-semibold">{label}</div>
        <div className="text-primary">{icon}</div>
      </div>
      <div className="font-display text-2xl mt-2">{value}</div>
    </div>
  );
}
