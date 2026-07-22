import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Plus, MessageSquare, ArrowRight, AlertCircle, Boxes, Eye,
  TrendingUp, ShoppingCart, Wallet, Star, Users, PackageCheck,
} from "lucide-react";
import { mergeSupplierListings, useSupplierListings } from "@/lib/supplier-listings";
import { orders, rfqs, products as MOCK_PRODUCTS } from "@/lib/mock-data";
import { useInventoryMap, getInventory, computeStatus } from "@/lib/inventory";
import { useMySupplierProducts } from "@/lib/db";

export const Route = createFileRoute("/supplier-portal/")({
  component: PortalDashboard,
});

const RANGES = ["Today", "7 Days", "30 Days", "This Month", "All Time"] as const;
type Range = typeof RANGES[number];

// Demo data per range — deterministic so numbers feel real.
const RANGE_DATA: Record<Range, {
  gross: number; orders: number; escrow: number; requests: number; convRate: number;
  chart: { label: string; value: number }[];
  chartTitle: string;
}> = {
  "Today":     { gross: 42800,  orders: 2,  escrow: 18500, requests: 4,  convRate: 33,
    chartTitle: "Hourly", chart: [
      { label: "8a", value: 4000 }, { label: "10a", value: 12000 }, { label: "12p", value: 8000 },
      { label: "2p", value: 15000 }, { label: "4p", value: 3800 }, { label: "6p", value: 0 },
    ]},
  "7 Days":    { gross: 266000, orders: 11, escrow: 62400, requests: 18, convRate: 29,
    chartTitle: "Daily", chart: [
      { label: "Mon", value: 22000 }, { label: "Tue", value: 35000 }, { label: "Wed", value: 18000 },
      { label: "Thu", value: 52000 }, { label: "Fri", value: 40000 }, { label: "Sat", value: 68000 }, { label: "Sun", value: 31000 },
    ]},
  "30 Days":   { gross: 482500, orders: 18, escrow: 95200, requests: 42, convRate: 31,
    chartTitle: "Weekly", chart: [
      { label: "W1", value: 96000 }, { label: "W2", value: 128000 },
      { label: "W3", value: 112000 }, { label: "W4", value: 146500 },
    ]},
  "This Month":{ gross: 512300, orders: 21, escrow: 108400, requests: 47, convRate: 32,
    chartTitle: "Weekly", chart: [
      { label: "W1", value: 102000 }, { label: "W2", value: 138000 },
      { label: "W3", value: 121000 }, { label: "W4", value: 151300 },
    ]},
  "All Time":  { gross: 8420000, orders: 312, escrow: 195400, requests: 640, convRate: 34,
    chartTitle: "Monthly", chart: [
      { label: "Jan", value: 520000 }, { label: "Feb", value: 610000 }, { label: "Mar", value: 705000 },
      { label: "Apr", value: 640000 }, { label: "May", value: 780000 }, { label: "Jun", value: 820000 },
    ]},
};

const PIPELINE = [
  { key: "Awaiting Payment",     count: 2, value: 48000,  to: "/supplier-portal/orders", tone: "text-amber-600" },
  { key: "Escrow Funded",        count: 3, value: 95200,  to: "/supplier-portal/orders", tone: "text-primary" },
  { key: "Preparing Shipment",   count: 5, value: 140000, to: "/supplier-portal/orders", tone: "text-primary" },
  { key: "In Transit",           count: 2, value: 61000,  to: "/supplier-portal/orders", tone: "text-primary" },
  { key: "Delivered",            count: 4, value: 88000,  to: "/supplier-portal/orders", tone: "text-success" },
  { key: "Completed",            count: 8, value: 199300, to: "/supplier-portal/orders", tone: "text-success" },
  { key: "Disputed",             count: 0, value: 0,      to: "/supplier-portal/orders", tone: "text-destructive" },
];

const REQUEST_METRICS = {
  newRequests: 5, offersSent: 12, accepted: 4, rejected: 3, avgResponse: "2h",
};

const TOP_PRODUCTS = [
  { name: "Premium Well-Milled Rice 50kg Sack", views: 420, requests: 18, orders: 9, sales: 220500, stock: "In Stock" },
  { name: "Kraft Takeout Boxes 750ml",          views: 180, requests: 9,  orders: 4, sales: 52000,  stock: "Low Stock" },
  { name: "Dishwashing Liquid 1-Gallon",        views: 214, requests: 12, orders: 6, sales: 34200,  stock: "In Stock" },
  { name: "Portland Cement Type 1 — 40kg Bag",  views: 88,  requests: 4,  orders: 2, sales: 28400,  stock: "In Stock" },
];

const PROFILE_METRICS = {
  profileViews: 1240, catalogViews: 820, productViews: 3600,
  quoteClicks: 96, messageClicks: 44, conversion: 12,
};

const RATING_METRICS = {
  rating: 4.8, reviews: 312, completed: 1840, repeat: 64, disputeRate: 1.2,
};

const LATEST_REVIEWS = [
  { text: "Reliable rice supplier. Delivered on time and quality was consistent.", author: "Sunrise Hotel Group", stars: 5 },
  { text: "Great pricing on bulk orders. Communication could be a bit faster.", author: "Metro Catering Co.", stars: 4 },
];

function peso(n: number) {
  return "₱" + n.toLocaleString("en-PH");
}

function PortalDashboard() {
  const [range, setRange] = useState<Range>("30 Days");
  const data = RANGE_DATA[range];
  const aov = data.orders > 0 ? Math.round(data.gross / data.orders) : 0;

  const localListings = useSupplierListings();
  const remoteQuery = useMySupplierProducts();
  const listings = useMemo(
    () => mergeSupplierListings(localListings, remoteQuery.data ?? []),
    [localListings, remoteQuery.data],
  );
  useInventoryMap();
  const pendingListings = listings.filter((l) => l.status === "Pending Review").length;

  const trackable = [
    ...listings.map((l) => ({ id: l.id, title: l.name })),
    ...MOCK_PRODUCTS.filter((p) => p.supplierId === "sup_001").map((p) => ({ id: p.id, title: p.title })),
  ];
  const lowStock = trackable.filter((r) => computeStatus(getInventory(r.id)) === "Low Stock");
  const outStock = trackable.filter((r) => computeStatus(getInventory(r.id)) === "Out of Stock");
  const openOrders = orders.length;
  const quoteReqs = rfqs.length;

  const attention = useMemo(() => {
    const items: { icon: React.ReactNode; text: string; to: string; cta: string }[] = [];
    if (REQUEST_METRICS.newRequests > 0)
      items.push({ icon: <MessageSquare size={14} className="text-primary" />, text: `${REQUEST_METRICS.newRequests} buyer request${REQUEST_METRICS.newRequests === 1 ? "" : "s"} need a reply`, to: "/supplier-portal/quote-requests", cta: "Reply" });
    if (openOrders > 0)
      items.push({ icon: <PackageCheck size={14} className="text-amber-600" />, text: `${openOrders} order${openOrders === 1 ? "" : "s"} awaiting shipment`, to: "/supplier-portal/orders", cta: "Manage Order" });
    if (outStock.length > 0)
      items.push({ icon: <Boxes size={14} className="text-destructive" />, text: `${outStock.length} product${outStock.length === 1 ? "" : "s"} out of stock`, to: "/supplier-portal/inventory", cta: "Update Stock" });
    if (lowStock.length > 0)
      items.push({ icon: <Boxes size={14} className="text-amber-600" />, text: `${lowStock.length} product${lowStock.length === 1 ? "" : "s"} low stock`, to: "/supplier-portal/inventory", cta: "Update Stock" });
    if (pendingListings > 0)
      items.push({ icon: <AlertCircle size={14} className="text-amber-600" />, text: `${pendingListings} listing${pendingListings === 1 ? "" : "s"} pending review`, to: "/supplier-portal/products", cta: "View Listing" });
    if (data.escrow > 0)
      items.push({ icon: <Wallet size={14} className="text-primary" />, text: `${peso(data.escrow)} escrow pending release`, to: "/supplier-portal/orders", cta: "View Escrow" });
    return items;
  }, [openOrders, outStock.length, lowStock.length, pendingListings, data.escrow]);

  const hasSales = data.gross > 0;

  return (
    <div className="space-y-8">
      {/* Section 1: Sales Summary */}
      <section>
        <div className="flex items-end justify-between mb-3 flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-lg">Sales Summary</h2>
            <p className="text-xs text-muted-foreground">Your business at a glance.</p>
          </div>
          <div className="flex gap-1 rounded-md border bg-card p-1 text-xs">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded font-medium ${range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {!hasSales ? (
          <EmptyState
            title="No sales yet in this range"
            body="Reply to buyer requests or add more products to start receiving orders."
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Metric icon={<TrendingUp size={14} />} label="Gross Sales" value={peso(data.gross)} tone="text-success" />
            <Metric icon={<ShoppingCart size={14} />} label="Orders" value={String(data.orders)} />
            <Metric icon={<TrendingUp size={14} />} label="Avg Order Value" value={peso(aov)} />
            <Metric icon={<Wallet size={14} />} label="Escrow Held" value={peso(data.escrow)} tone="text-primary" />
            <Metric icon={<MessageSquare size={14} />} label="Quote Requests" value={String(data.requests)} />
            <Metric icon={<TrendingUp size={14} />} label="Conversion Rate" value={`${data.convRate}%`} tone="text-success" />
          </div>
        )}
      </section>

      {/* Sales Trend Chart */}
      <section className="rounded-lg border bg-card p-5">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-semibold">Sales Trend</h2>
            <p className="text-xs text-muted-foreground">{data.chartTitle} · {range}</p>
          </div>
          <div className="text-xs text-muted-foreground">Peak {peso(Math.max(...data.chart.map((c) => c.value)))}</div>
        </div>
        <BarChart data={data.chart} />
      </section>

      {/* Order Pipeline */}
      <section className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Order Pipeline</h2>
            <p className="text-xs text-muted-foreground">Where your orders are right now.</p>
          </div>
          <Link to="/supplier-portal/orders" className="text-sm text-primary font-semibold inline-flex items-center gap-1">
            View Orders <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {PIPELINE.map((p) => (
            <Link key={p.key} to={p.to} className="rounded-md border bg-background p-3 hover:border-primary/60 transition-colors">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{p.key}</div>
              <div className={`font-display text-xl mt-1 ${p.tone}`}>{p.count}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{peso(p.value)}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Buyer Requests + Ratings row */}
      <div className="grid lg:grid-cols-2 gap-4">
        <section className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Buyer Requests</h2>
              <p className="text-xs text-muted-foreground">How well you're responding to demand.</p>
            </div>
            <Link to="/supplier-portal/quote-requests" className="text-sm text-primary font-semibold inline-flex items-center gap-1">
              Reply <ArrowRight size={12} />
            </Link>
          </div>
          {REQUEST_METRICS.newRequests > 0 && (
            <div className="mb-3 text-xs bg-primary/5 border border-primary/20 text-primary rounded px-3 py-2">
              {REQUEST_METRICS.newRequests} buyer requests need a reply.
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <MiniStat label="New Requests" value={REQUEST_METRICS.newRequests} />
            <MiniStat label="Offers Sent" value={REQUEST_METRICS.offersSent} />
            <MiniStat label="Accepted Offers" value={REQUEST_METRICS.accepted} tone="text-success" />
            <MiniStat label="Rejected" value={REQUEST_METRICS.rejected} />
            <MiniStat label="Avg Response" value={REQUEST_METRICS.avgResponse} />
            <MiniStat label="Conversion" value={`${data.convRate}%`} tone="text-success" />
          </div>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Ratings & Reviews</h2>
              <p className="text-xs text-muted-foreground">How buyers rate your business.</p>
            </div>
            <Link to="/supplier-portal/preview" className="text-sm text-primary font-semibold inline-flex items-center gap-1">
              View Public Preview <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex items-baseline gap-3 mb-3">
            <div className="font-display text-4xl">{RATING_METRICS.rating.toFixed(1)}</div>
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
            </div>
            <div className="text-xs text-muted-foreground">{RATING_METRICS.reviews} reviews</div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <MiniStat label="Completed Orders" value={RATING_METRICS.completed.toLocaleString()} />
            <MiniStat label="Repeat Buyers" value={`${RATING_METRICS.repeat}%`} tone="text-success" />
            <MiniStat label="Dispute Rate" value={`${RATING_METRICS.disputeRate}%`} />
            <MiniStat label="Reviews" value={RATING_METRICS.reviews} />
          </div>
          <div className="space-y-2">
            {LATEST_REVIEWS.map((r, i) => (
              <div key={i} className="text-xs border rounded p-3 bg-background">
                <div className="flex items-center gap-1 text-amber-500 mb-1">
                  {Array.from({ length: r.stars }).map((_, j) => <Star key={j} size={11} fill="currentColor" />)}
                </div>
                <div className="text-foreground">"{r.text}"</div>
                <div className="text-muted-foreground mt-1">— {r.author}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Top Products */}
      <section className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Top Products</h2>
            <p className="text-xs text-muted-foreground">What's driving your sales.</p>
          </div>
          <Link to="/supplier-portal/products" className="text-sm text-primary font-semibold inline-flex items-center gap-1">
            All Listings <ArrowRight size={12} />
          </Link>
        </div>
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground border-b">
              <tr>
                <th className="text-left font-semibold px-5 py-2">Product</th>
                <th className="text-right font-semibold px-3 py-2">Views</th>
                <th className="text-right font-semibold px-3 py-2">Requests</th>
                <th className="text-right font-semibold px-3 py-2">Orders</th>
                <th className="text-right font-semibold px-3 py-2">Sales</th>
                <th className="text-left font-semibold px-3 py-2">Stock</th>
                <th className="text-right font-semibold px-5 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {TOP_PRODUCTS.map((p) => (
                <tr key={p.name}>
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{p.views}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{p.requests}</td>
                  <td className="px-3 py-3 text-right tabular-nums">{p.orders}</td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold">{peso(p.sales)}</td>
                  <td className="px-3 py-3">
                    <span className={`chip ${p.stock === "Low Stock" ? "bg-amber-100 text-amber-800" : p.stock === "Out of Stock" ? "bg-destructive/10 text-destructive" : "chip-verified"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <Link to="/supplier-portal/products" className="text-xs text-primary font-semibold mr-3">View</Link>
                    <Link to="/supplier-portal/inventory" className="text-xs text-primary font-semibold">Update Stock</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Profile Performance */}
      <section className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Profile & Catalog Performance</h2>
            <p className="text-xs text-muted-foreground">How buyers discover and engage with your business.</p>
          </div>
          <Link to="/supplier-portal/preview" className="text-sm text-primary font-semibold inline-flex items-center gap-1">
            <Eye size={12} /> Preview Public Profile
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MiniStat label="Profile Views" value={PROFILE_METRICS.profileViews.toLocaleString()} icon={<Users size={12} />} />
          <MiniStat label="Catalog Views" value={PROFILE_METRICS.catalogViews.toLocaleString()} />
          <MiniStat label="Product Views" value={PROFILE_METRICS.productViews.toLocaleString()} />
          <MiniStat label="Quote Clicks" value={PROFILE_METRICS.quoteClicks} />
          <MiniStat label="Message Clicks" value={PROFILE_METRICS.messageClicks} />
          <MiniStat label="Buyer Conversion" value={`${PROFILE_METRICS.conversion}%`} tone="text-success" />
        </div>
      </section>

      {/* Needs Attention */}
      <section className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold mb-3">Needs Attention</h2>
        {attention.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">You're all caught up. 🎉</div>
        ) : (
          <ul className="divide-y">
            {attention.map((a, i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <span>{a.icon}</span>
                <div className="flex-1 text-sm">{a.text}</div>
                <Link to={a.to} className="text-xs text-primary font-semibold inline-flex items-center gap-1">
                  {a.cta} <ArrowRight size={12} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Quick actions footer */}
      <div className="grid md:grid-cols-3 gap-3">
        <QuickAction to="/supplier-portal/products/new" icon={<Plus size={16} />} label="Add Product" primary />
        <QuickAction to="/supplier-portal/quote-requests" icon={<MessageSquare size={16} />} label="View Buyer Requests" />
        <QuickAction to="/supplier-portal/preview" icon={<Eye size={16} />} label="Preview Public Profile" />
      </div>
    </div>
  );
}

function Metric({ icon, label, value, tone }: { icon?: React.ReactNode; label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
        {icon}{label}
      </div>
      <div className={`font-display text-2xl mt-1 ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

function MiniStat({ label, value, tone, icon }: { label: string; value: string | number; tone?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
        {icon}{label}
      </div>
      <div className={`font-display text-lg mt-0.5 ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d) => {
        const h = Math.max(4, Math.round((d.value / max) * 140));
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            <div className="text-[10px] text-muted-foreground tabular-nums truncate w-full text-center">
              {d.value > 0 ? "₱" + (d.value / 1000).toFixed(0) + "k" : "—"}
            </div>
            <div className="w-full bg-primary/80 hover:bg-primary rounded-t transition-colors" style={{ height: h }} />
            <div className="text-[11px] text-muted-foreground font-medium">{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border-2 border-dashed p-8 text-center">
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-sm text-muted-foreground">{body}</div>
    </div>
  );
}

function QuickAction({ to, icon, label, primary }: { to: string; icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <Link
      to={to}
      className={`rounded-lg border p-4 flex items-center justify-between font-semibold text-sm transition-colors ${
        primary ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:border-primary/60"
      }`}
    >
      <span className="inline-flex items-center gap-2">{icon}{label}</span>
      <ArrowRight size={14} />
    </Link>
  );
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Active": "chip-verified",
    "Draft": "",
    "Pending Review": "chip-primary",
    "Needs Changes": "bg-amber-100 text-amber-800",
    "Rejected": "bg-destructive/10 text-destructive",
    "Paused": "bg-muted",
    "Archived": "bg-muted",
  };
  return <span className={`chip ${map[status] ?? ""}`}>{status}</span>;
}
