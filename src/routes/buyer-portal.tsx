import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { formatPhp, supplierById, orders as mockOrders } from "@/lib/mock-data";
import { useDemoOrders } from "@/lib/cart";
import { useAllRfqs } from "@/lib/rfq-store";
import { useAuth } from "@/lib/auth-store";
import { Wallet, Package, FileText, TrendingUp, Plus, Search, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/buyer-portal")({
  head: () => ({ meta: [{ title: "Buyer Portal — PSG" }] }),
  component: BuyerPortal,
});

function BuyerPortal() {
  const { user } = useAuth();
  const demoOrders = useDemoOrders();
  const rfqs = useAllRfqs();

  const allOrders = useMemo(() => {
    const ids = new Set(demoOrders.map((o) => o.id));
    return [...demoOrders, ...mockOrders.filter((o) => !ids.has(o.id))];
  }, [demoOrders]);

  const totalSpend = allOrders.reduce((n, o) => n + o.totalPhp, 0);
  const activeOrders = allOrders.filter((o) => o.escrowState !== "Released to Supplier" && o.escrowState !== "Disputed").length;
  const openRfqs = rfqs.filter((r) => r.status === "Open" || r.status === "Receiving Quotes" || r.status === "Awaiting Decision").length;
  const suppliersCount = new Set(allOrders.map((o) => o.supplierId)).size;

  // Simple 6-month synthetic trend derived from orders
  const monthly = useMemo(() => {
    const base = totalSpend / 6 || 12000;
    return [0.7, 0.9, 1.1, 0.95, 1.2, 1.05].map((m, i) => ({
      label: ["Feb", "Mar", "Apr", "May", "Jun", "Jul"][i],
      value: Math.round(base * m),
    }));
  }, [totalSpend]);
  const maxV = Math.max(...monthly.map((m) => m.value), 1);

  const spendBySupplier = useMemo(() => {
    const map = new Map<string, number>();
    allOrders.forEach((o) => map.set(o.supplierId, (map.get(o.supplierId) || 0) + o.totalPhp));
    return Array.from(map.entries())
      .map(([id, total]) => ({ supplier: supplierById(id), total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [allOrders]);

  const needsAction = [
    ...allOrders
      .filter((o) => o.escrowState === "Delivered — Awaiting Confirmation")
      .slice(0, 3)
      .map((o) => ({
        type: "confirm" as const,
        text: `Confirm delivery for order ${o.id.toUpperCase()}`,
        href: `/orders/${o.id}`,
      })),
    ...rfqs
      .filter((r) => r.status === "Awaiting Decision")
      .slice(0, 3)
      .map((r) => ({ type: "decide" as const, text: `Choose supplier for "${r.title}"`, href: `/rfq/${r.id}` })),
  ].slice(0, 5);

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-primary">Buyer Portal</div>
            <h1 className="font-display text-3xl mt-1">Welcome back, {user?.fullName?.split(" ")[0] || "Buyer"}</h1>
            <p className="text-sm text-muted-foreground">{user?.businessName || "PSG member"} · Procurement command center</p>
          </div>
          <div className="flex gap-2">
            <Link to="/rfq/new" className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-md px-4 py-2.5 text-sm font-semibold">
              <Plus size={16} /> Get supplier quotes
            </Link>
            <Link to="/products" className="inline-flex items-center gap-1.5 border bg-card rounded-md px-4 py-2.5 text-sm font-semibold">
              <Search size={16} /> Browse marketplace
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI icon={<Wallet size={18} />} label="Total spend" value={formatPhp(totalSpend)} hint={`${allOrders.length} orders lifetime`} />
          <KPI icon={<Package size={18} />} label="Active orders" value={String(activeOrders)} hint="Escrow-protected" />
          <KPI icon={<FileText size={18} />} label="Open RFQs" value={String(openRfqs)} hint="Awaiting supplier offers" />
          <KPI icon={<TrendingUp size={18} />} label="Trusted suppliers" value={String(suppliersCount)} hint="Verified partners" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Spend Trend */}
          <div className="lg:col-span-2 rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Monthly spend</h2>
                <p className="text-xs text-muted-foreground">Last 6 months across all orders</p>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl">{formatPhp(monthly[monthly.length - 1].value)}</div>
                <div className="text-xs text-success">This month</div>
              </div>
            </div>
            <div className="flex items-end gap-3 h-40">
              {monthly.map((m) => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end h-32">
                    <div
                      className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-md hover:opacity-90 transition"
                      style={{ height: `${(m.value / maxV) * 100}%` }}
                      title={formatPhp(m.value)}
                    />
                  </div>
                  <div className="text-[11px] text-muted-foreground font-semibold">{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Action */}
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-primary" />
              <h2 className="font-semibold">Needs your attention</h2>
            </div>
            {needsAction.length === 0 ? (
              <div className="text-sm text-muted-foreground py-8 text-center">All clear. 🎉</div>
            ) : (
              <ul className="space-y-2">
                {needsAction.map((n, i) => (
                  <li key={i}>
                    <Link to={n.href as any} className="flex items-start gap-2 p-2.5 rounded-md hover:bg-muted text-sm">
                      <span className="chip chip-primary shrink-0 text-[10px]">{n.type === "confirm" ? "Confirm" : "Decide"}</span>
                      <span className="flex-1">{n.text}</span>
                      <ArrowRight size={14} className="text-muted-foreground mt-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Recent orders + Top suppliers */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Recent orders</h2>
              <Link to="/orders" className="text-xs text-primary font-semibold">View all →</Link>
            </div>
            <div className="divide-y">
              {allOrders.slice(0, 6).map((o) => {
                const s = supplierById(o.supplierId);
                return (
                  <Link key={o.id} to="/orders/$id" params={{ id: o.id }} className="flex items-center gap-3 py-3 hover:bg-muted/40 px-2 -mx-2 rounded">
                    <div className="size-10 rounded-md bg-gradient-to-br from-primary to-gold grid place-items-center text-white font-display shrink-0">{s.name.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        <span className="font-mono">{o.id.toUpperCase()}</span> · {o.placed} · {o.escrowState}
                      </div>
                    </div>
                    <div className="text-sm font-semibold shrink-0">{formatPhp(o.totalPhp)}</div>
                  </Link>
                );
              })}
              {allOrders.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">No orders yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold mb-3">Top suppliers</h2>
            <div className="space-y-3">
              {spendBySupplier.map(({ supplier, total }) => (
                <Link key={supplier.id} to="/suppliers/$id" params={{ id: supplier.id }} className="flex items-center gap-3 hover:bg-muted/40 p-2 -mx-2 rounded">
                  <div className="size-9 rounded-md bg-gradient-to-br from-primary to-gold grid place-items-center text-white text-xs font-bold shrink-0">{supplier.name.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1">
                      {supplier.name}
                      {supplier.verified && <ShieldCheck size={12} className="text-success shrink-0" />}
                    </div>
                    <div className="text-xs text-muted-foreground">{supplier.location}</div>
                  </div>
                  <div className="text-xs font-semibold shrink-0">{formatPhp(total)}</div>
                </Link>
              ))}
              {spendBySupplier.length === 0 && (
                <div className="text-sm text-muted-foreground py-4 text-center">Place your first order to build your supplier network.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function KPI({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <div className="text-xs uppercase tracking-wider font-semibold">{label}</div>
        <div className="text-primary">{icon}</div>
      </div>
      <div className="font-display text-2xl mt-2">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{hint}</div>
    </div>
  );
}
