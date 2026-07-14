import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Store, RefreshCw, MessageSquare, PackageCheck, Wallet, CreditCard, Eye } from "lucide-react";
import { orders, rfqs, formatPhp, supplierById, products } from "@/lib/mock-data";

export const Route = createFileRoute("/buyer-portal/")({
  component: BuyerOverview,
});

function BuyerOverview() {
  const openRequests = rfqs.filter((r) => r.status === "Open" || r.status === "Receiving Quotes").slice(0, 4);
  const activeOrders = orders.slice(0, 3);
  const protectedTotal = 95200;

  const attention = [
    { icon: <MessageSquare size={14} className="text-primary" />, text: "3 supplier offers waiting for your decision", to: "/buyer-portal/offers", cta: "Review Offer" },
    { icon: <PackageCheck size={14} className="text-amber-600" />, text: "Order ORD_24011 is awaiting delivery confirmation", to: "/buyer-portal/orders", cta: "Confirm Delivery" },
    { icon: <CreditCard size={14} className="text-primary" />, text: "1 order payment is awaiting payment", to: "/buyer-portal/orders", cta: "Pay Now" },
    { icon: <FileText size={14} className="text-amber-600" />, text: "2 quote requests have no supplier replies yet", to: "/buyer-portal/quote-requests", cta: "View Request" },
  ];

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <section>
        <h2 className="font-semibold text-lg mb-3">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <QuickAction icon={<FileText size={18} />} title="Post Quote Request" text="Tell suppliers what you need and receive offers." to="/rfq/new" cta="Post Request" />
          <QuickAction icon={<Store size={18} />} title="Browse Verified Suppliers" text="Find trusted suppliers by category and location." to="/suppliers" cta="Browse Suppliers" />
          <QuickAction icon={<RefreshCw size={18} />} title="Reorder Supplies" text="Repeat a past order quickly." to="/buyer-portal/reorders" cta="View Reorders" />
        </div>
      </section>

      {/* Essential Metrics */}
      <section>
        <h2 className="font-semibold text-lg mb-3">Essentials</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric label="Open Requests" value="4" />
          <Metric label="Supplier Offers" value="7" tone="text-primary" />
          <Metric label="Active Orders" value="3" />
          <Metric label="Protected Payments" value={formatPhp(protectedTotal)} tone="text-success" />
        </div>
      </section>

      {/* Needs Attention */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold mb-3">Needs Attention</h2>
        <ul className="divide-y">
          {attention.map((a, i) => (
            <li key={i} className="flex items-center justify-between py-3 gap-3">
              <div className="flex items-center gap-2 text-sm">{a.icon}<span>{a.text}</span></div>
              <Link to={a.to} className="text-xs font-semibold text-primary whitespace-nowrap">{a.cta} →</Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Active Orders */}
      <section className="rounded-lg border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="font-semibold">Active Orders</h2>
          <Link to="/buyer-portal/orders" className="text-xs text-primary font-semibold">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground border-b bg-muted/30">
              <tr>
                <th className="text-left px-5 py-2">Order</th>
                <th className="text-left px-3 py-2">Supplier</th>
                <th className="text-left px-3 py-2">Product</th>
                <th className="text-right px-3 py-2">Amount</th>
                <th className="text-left px-3 py-2">Payment</th>
                <th className="text-left px-3 py-2">Order Status</th>
                <th className="text-right px-5 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activeOrders.map((o) => {
                const s = supplierById(o.supplierId);
                const first = o.items[0];
                const prod = products.find((p) => p.id === first?.productId);
                return (
                  <tr key={o.id}>
                    <td className="px-5 py-3 font-mono text-xs">{o.id.toUpperCase()}</td>
                    <td className="px-3 py-3">{s.name}</td>
                    <td className="px-3 py-3 text-xs text-muted-foreground truncate max-w-[200px]">{prod?.title ?? "—"}</td>
                    <td className="px-3 py-3 text-right font-semibold text-primary">{formatPhp(o.totalPhp)}</td>
                    <td className="px-3 py-3"><span className="chip chip-verified">Protected</span></td>
                    <td className="px-3 py-3"><span className="chip">{o.escrowState}</span></td>
                    <td className="px-5 py-3 text-right">
                      <Link to="/orders/$id" params={{ id: o.id }} className="text-xs font-semibold text-primary">View →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reorder Favorites */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Reorder Favorites</h2>
          <Link to="/buyer-portal/reorders" className="text-xs text-primary font-semibold">All reorders →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {openRequests.slice(0, 4).map((r, i) => {
            const prod = products[i % products.length];
            const s = supplierById(prod.supplierId);
            return (
              <div key={r.id} className="rounded-lg border bg-card p-4">
                <div className="text-xs text-muted-foreground">Last ordered 14 days ago</div>
                <div className="font-medium text-sm mt-1 line-clamp-2">{prod.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.name}</div>
                <div className="text-xs mt-1">
                  <span className="text-muted-foreground">Qty:</span> <span className="font-semibold">40 {prod.unit}</span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">Price:</span> <span className="font-semibold text-primary">{formatPhp(prod.pricePhp * 40)}</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button className="text-xs font-semibold bg-primary text-primary-foreground rounded py-1.5">Reorder</button>
                  <Link to="/rfq/new" className="text-xs font-semibold border rounded py-1.5 text-center">Updated Quote</Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function QuickAction({ icon, title, text, to, cta }: { icon: React.ReactNode; title: string; text: string; to: string; cta: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center">{icon}</div>
      <div className="font-semibold mt-3">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{text}</div>
      <Link to={to as any} className="inline-flex items-center gap-1 text-primary text-sm font-semibold mt-3">
        {cta} →
      </Link>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`font-display text-2xl mt-1 ${tone || ""}`}>{value}</div>
    </div>
  );
}
