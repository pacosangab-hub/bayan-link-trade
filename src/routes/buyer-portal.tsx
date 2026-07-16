import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useState } from "react";
import { useAllRfqs } from "@/lib/rfq-store";
import { orders as MOCK_ORDERS, supplierById, formatPhp } from "@/lib/mock-data";
import { DELIVERY_METHODS, deliveryLabel } from "@/lib/delivery";
import {
  LayoutDashboard, ClipboardList, PackageCheck, Boxes, Truck, RotateCcw,
  Send, Users, Repeat, AlertCircle, ArrowRight, MessageSquare, Wallet,
  Package, ShieldCheck, MapPin,
} from "lucide-react";

export const Route = createFileRoute("/buyer-portal")({
  head: () => ({ meta: [{ title: "Buyer Portal — PSG" }] }),
  component: () => (
    <RequireAuth>
      <BuyerPortal />
    </RequireAuth>
  ),
});

type Tab = "overview" | "requests" | "offers" | "orders" | "deliveries" | "reorders";

// Attach a delivery method + status to each demo order deterministically.
type DemoDelivery = { method: keyof typeof DELIVERY_METHODS; status: string; eta: string; carrier?: string; tracking?: string; pickupAddress?: string; };
const DEMO_DELIVERIES: Record<string, DemoDelivery> = {
  ord_24011: { method: "supplier_owned_logistics", status: "Scheduled for Delivery", eta: "Jul 18" },
  ord_24008: { method: "third_party_carrier", status: "In Transit", eta: "Jul 16", carrier: "LBC", tracking: "LBC123456789" },
  ord_23994: { method: "pickup_warehouse", status: "Ready for Pickup", eta: "Ready now", pickupAddress: "Silang, Cavite Warehouse" },
  ord_23901: { method: "supplier_owned_logistics", status: "Buyer Confirmed", eta: "Completed" },
  ord_23845: { method: "third_party_carrier", status: "Buyer Confirmed", eta: "Completed", carrier: "J&T", tracking: "JT7788221" },
};
function deliveryFor(id: string): DemoDelivery {
  return DEMO_DELIVERIES[id] || { method: "supplier_owned_logistics", status: "Preparing", eta: "TBD" };
}

function BuyerPortal() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Buyer Portal</div>
          <h1 className="font-display text-3xl mt-0.5">Buyer Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track quote requests, supplier offers, protected orders, deliveries, and reorders.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            <span className="font-semibold text-foreground">Lola Nena's Carinderia Group</span> · Buyer Account · Metro Manila
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/rfq-center" className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold inline-flex items-center gap-1.5">
              <Send size={14} /> Post Quote Request
            </Link>
            <Link to="/suppliers" className="border rounded-md px-4 py-2 text-sm font-semibold inline-flex items-center gap-1.5">
              <Users size={14} /> Browse Suppliers
            </Link>
            <Link to="/orders" className="border rounded-md px-4 py-2 text-sm font-semibold inline-flex items-center gap-1.5">
              <Package size={14} /> View Orders
            </Link>
          </div>
        </div>
      </div>

      <div className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 flex gap-1 overflow-x-auto text-sm">
          {[
            { k: "overview", l: "Overview", i: LayoutDashboard },
            { k: "requests", l: "Quote Requests", i: ClipboardList },
            { k: "offers", l: "Supplier Offers", i: PackageCheck },
            { k: "orders", l: "Orders", i: Boxes },
            { k: "deliveries", l: "Deliveries", i: Truck },
            { k: "reorders", l: "Reorders", i: RotateCcw },
          ].map(({ k, l, i: Icon }) => (
            <button key={k} onClick={() => setTab(k as Tab)}
              className={`inline-flex items-center gap-1.5 px-3 py-3 whitespace-nowrap font-medium border-b-2 transition-colors ${tab === k ? "border-primary text-primary" : "border-transparent text-foreground/70 hover:text-foreground"}`}>
              <Icon size={14} /> {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {tab === "overview" && <OverviewTab setTab={setTab} />}
        {tab === "requests" && <RequestsTab />}
        {tab === "offers" && <OffersTab />}
        {tab === "orders" && <OrdersTab />}
        {tab === "deliveries" && <DeliveriesTab />}
        {tab === "reorders" && <ReordersTab />}
      </div>
    </AppShell>
  );
}

function OverviewTab({ setTab }: { setTab: (t: Tab) => void }) {
  const rfqs = useAllRfqs();
  const openRequests = rfqs.filter((r) => r.status === "Open" || r.status === "Receiving Quotes").length;
  const offerCount = rfqs.reduce((n, r) => n + r.quotes.length, 0);
  const activeOrders = MOCK_ORDERS.filter((o) => o.escrowState !== "Released to Supplier");
  const protectedTotal = activeOrders.reduce((n, o) => n + o.totalPhp, 0);

  return (
    <div className="space-y-8">
      {/* Quick Actions */}
      <section>
        <SectionHeading>Quick Actions</SectionHeading>
        <div className="grid md:grid-cols-3 gap-3 mt-3">
          <ActionCard icon={Send} title="Post Quote Request" text="Tell suppliers what you need and receive offers." cta="Post Request" to="/rfq-center" />
          <ActionCard icon={ShieldCheck} title="Browse Verified Suppliers" text="Find trusted suppliers by category and location." cta="Browse Suppliers" to="/suppliers" />
          <ActionCard icon={Repeat} title="Reorder Supplies" text="Repeat a past order quickly." cta="View Reorders" onClick={() => setTab("reorders")} />
        </div>
      </section>

      {/* Essential Metrics */}
      <section>
        <SectionHeading>Essential Metrics</SectionHeading>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <StatCard icon={ClipboardList} label="Open Requests" value={String(openRequests || 4)} />
          <StatCard icon={PackageCheck} label="Supplier Offers" value={String(offerCount || 7)} />
          <StatCard icon={Boxes} label="Active Orders" value={String(activeOrders.length || 3)} />
          <StatCard icon={Wallet} label="Protected Payments" value={formatPhp(protectedTotal || 95200)} />
        </div>
      </section>

      {/* Needs Attention */}
      <section>
        <SectionHeading>Needs Attention</SectionHeading>
        <div className="mt-3 border rounded-lg divide-y bg-card">
          {[
            { icon: PackageCheck, text: "3 supplier offers waiting for your decision", action: "Review Offers", onClick: () => setTab("offers") },
            { icon: Truck, text: "Order ORD_24011 is awaiting delivery confirmation", action: "Confirm Delivery", href: "/orders/ord_24011" },
            { icon: Wallet, text: "1 order payment is awaiting payment", action: "Pay Now", href: "/orders/ord_24008" },
            { icon: ClipboardList, text: "2 quote requests have no supplier replies yet", action: "View Request", onClick: () => setTab("requests") },
            { icon: MapPin, text: "Delivery method needs confirmation on ORD_23994", action: "Choose Delivery Method", href: "/orders/ord_23994" },
            { icon: MessageSquare, text: "1 supplier is waiting for your reply", action: "Reply", href: "/messages" },
          ].map((row, i) => (
            <div key={i} className="p-4 flex items-center gap-3 flex-wrap">
              <row.icon size={16} className="text-primary shrink-0" />
              <span className="text-sm flex-1">{row.text}</span>
              {row.href ? (
                <Link to={row.href} className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                  {row.action} <ArrowRight size={12} />
                </Link>
              ) : (
                <button onClick={row.onClick} className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                  {row.action} <ArrowRight size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Active Orders */}
      <section>
        <div className="flex justify-between items-end">
          <SectionHeading>Active Orders</SectionHeading>
          <Link to="/orders" className="text-xs font-semibold text-primary hover:underline">View all →</Link>
        </div>
        <OrdersTable orders={activeOrders.slice(0, 5)} />
      </section>

      {/* Delivery Updates */}
      <section>
        <SectionHeading>Delivery Updates</SectionHeading>
        <DeliveryCards orders={activeOrders.slice(0, 3)} />
      </section>

      {/* Reorder Favorites */}
      <section>
        <SectionHeading>Reorder Favorites</SectionHeading>
        <ReorderList />
      </section>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-lg">{children}</h2>;
}
function ActionCard({ icon: Icon, title, text, cta, to, onClick }: {
  icon: React.ComponentType<{ size?: number; className?: string }>; title: string; text: string; cta: string; to?: string; onClick?: () => void;
}) {
  const body = (
    <>
      <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center mb-3"><Icon size={20} /></div>
      <div className="font-semibold">{title}</div>
      <div className="text-sm text-muted-foreground mt-1">{text}</div>
      <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">{cta} <ArrowRight size={14} /></div>
    </>
  );
  if (to) return <Link to={to} className="border rounded-lg p-4 bg-card hover:border-primary transition-colors">{body}</Link>;
  return <button onClick={onClick} className="border rounded-lg p-4 bg-card hover:border-primary transition-colors text-left">{body}</button>;
}
function StatCard({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-primary" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">{label}</span>
      </div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}

function OrdersTable({ orders }: { orders: typeof MOCK_ORDERS }) {
  if (!orders.length) return <div className="mt-3 text-sm text-muted-foreground border rounded-lg p-6 text-center">No active orders.</div>;
  return (
    <div className="mt-3 border rounded-lg overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="text-left p-3">Order</th>
              <th className="text-left p-3">Supplier</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Delivery</th>
              <th className="text-left p-3">Payment</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const s = supplierById(o.supplierId);
              const d = deliveryFor(o.id);
              return (
                <tr key={o.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{o.id.toUpperCase()}</td>
                  <td className="p-3">
                    <div className="text-sm font-semibold">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.location}</div>
                  </td>
                  <td className="p-3 font-semibold">{formatPhp(o.totalPhp)}</td>
                  <td className="p-3 text-xs">{DELIVERY_METHODS[d.method].short}</td>
                  <td className="p-3"><span className="text-xs px-2 py-0.5 rounded bg-success/10 text-success font-semibold">Protected</span></td>
                  <td className="p-3 text-xs">{o.escrowState}</td>
                  <td className="p-3">
                    <Link to="/orders/$id" params={{ id: o.id }} className="text-primary text-xs font-semibold hover:underline">View Order →</Link>
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

function DeliveryCards({ orders }: { orders: typeof MOCK_ORDERS }) {
  if (!orders.length) return <div className="mt-3 text-sm text-muted-foreground border rounded-lg p-6 text-center">No active deliveries.</div>;
  return (
    <div className="mt-3 grid md:grid-cols-2 lg:grid-cols-3 gap-3">
      {orders.map((o) => {
        const s = supplierById(o.supplierId);
        const d = deliveryFor(o.id);
        const m = DELIVERY_METHODS[d.method];
        return (
          <div key={o.id} className="border rounded-lg p-4 bg-card">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-mono text-xs text-muted-foreground">{o.id.toUpperCase()}</div>
                <div className="font-semibold text-sm">{s.name}</div>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-primary/10 text-primary">{m.short}</span>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground text-xs">Status</span><span className="font-semibold">{d.status}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground text-xs">ETA</span><span className="font-semibold">{d.eta}</span></div>
              {d.tracking && <div className="flex justify-between"><span className="text-muted-foreground text-xs">Tracking</span><span className="font-mono text-xs">{d.tracking}</span></div>}
              {d.carrier && <div className="flex justify-between"><span className="text-muted-foreground text-xs">Carrier</span><span className="text-xs">{d.carrier}</span></div>}
              {d.pickupAddress && <div className="flex justify-between"><span className="text-muted-foreground text-xs">Pickup</span><span className="text-xs">{d.pickupAddress}</span></div>}
            </div>
            <Link to="/orders/$id" params={{ id: o.id }} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              {d.method === "pickup_warehouse" ? "Confirm Picked Up" : d.method === "third_party_carrier" ? "Track Package" : "Confirm Delivery"} <ArrowRight size={14} />
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function ReorderList() {
  const items = MOCK_ORDERS.slice(0, 4);
  return (
    <div className="mt-3 grid md:grid-cols-2 gap-3">
      {items.map((o) => {
        const s = supplierById(o.supplierId);
        return (
          <div key={o.id} className="border rounded-lg p-4 bg-card flex justify-between items-center">
            <div>
              <div className="font-semibold text-sm">{s.name}</div>
              <div className="text-xs text-muted-foreground">Order {o.id.toUpperCase()} · {formatPhp(o.totalPhp)}</div>
            </div>
            <Link to="/products" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
              <Repeat size={12} /> Reorder
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function RequestsTab() {
  const rfqs = useAllRfqs();
  return (
    <div>
      <h2 className="font-display text-xl mb-3">Quote Requests</h2>
      <div className="border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left p-3">Request</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Qty</th>
              <th className="text-left p-3">Offers</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rfqs.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 text-sm">{r.title}</td>
                <td className="p-3 text-xs">{r.category}</td>
                <td className="p-3 text-xs">{r.qty} {r.unit || ""}</td>
                <td className="p-3 font-semibold">{r.responses || r.quotes.length}</td>
                <td className="p-3"><span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">{r.status}</span></td>
                <td className="p-3"><Link to="/rfq/$id" params={{ id: r.id }} className="text-primary text-xs font-semibold hover:underline">View →</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OffersTab() {
  const rfqs = useAllRfqs();
  const offers = rfqs.flatMap((r) => r.quotes.map((q) => ({ r, q })));
  if (!offers.length) return <div className="border rounded-lg p-8 text-center text-sm text-muted-foreground">No supplier offers yet.</div>;
  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl">Supplier Offers</h2>
      {offers.map(({ r, q }, i) => {
        const s = supplierById(q.supplierId);
        return (
          <div key={i} className="border rounded-lg p-4 bg-card flex justify-between items-center flex-wrap gap-3">
            <div>
              <div className="text-xs text-muted-foreground">{r.title}</div>
              <div className="font-semibold">{s.name}</div>
              <div className="text-xs">{formatPhp(q.pricePhp)}/unit · MOQ {q.moq} · {q.leadTimeDays}d</div>
            </div>
            <Link to="/rfq-center" className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold">Review Offer</Link>
          </div>
        );
      })}
    </div>
  );
}

function OrdersTab() {
  return (
    <div>
      <h2 className="font-display text-xl mb-3">Orders</h2>
      <OrdersTable orders={MOCK_ORDERS} />
    </div>
  );
}

function DeliveriesTab() {
  return (
    <div>
      <h2 className="font-display text-xl mb-3">Deliveries</h2>
      <p className="text-sm text-muted-foreground">Track pickups, third-party carriers, and supplier-owned deliveries.</p>
      <DeliveryCards orders={MOCK_ORDERS} />
    </div>
  );
}

function ReordersTab() {
  return (
    <div>
      <h2 className="font-display text-xl mb-3">Reorders</h2>
      <p className="text-sm text-muted-foreground">Repeat a past order in one click.</p>
      <ReorderList />
    </div>
  );
}
