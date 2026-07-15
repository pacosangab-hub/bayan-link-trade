import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { orders, rfqs, supplierById, formatPhp } from "@/lib/mock-data";
import { TrendingUp, Package, FileText, Wallet } from "lucide-react";

export const Route = createFileRoute("/dashboard/buyer")({
  head: () => ({ meta: [{ title: "Buyer Dashboard — PSG" }] }),
  component: BuyerDash,
});

function BuyerDash() {
  const myOrders = orders.slice(0, 4);
  const myRfqs = rfqs.slice(0, 3);
  const totalGMV = myOrders.reduce((a, o) => a + o.totalPhp, 0);

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 flex justify-between items-end flex-wrap gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Buyer dashboard</div>
            <h1 className="font-display text-3xl">Good morning, Lola Nena's</h1>
            <p className="text-sm text-muted-foreground">8 branches · verified business buyer · member since Feb 2026</p>
          </div>
          <div className="flex gap-2">
            <Link to="/rfq/new" className="bg-primary text-primary-foreground px-4 py-2.5 rounded-md font-semibold text-sm">Post RFQ</Link>
            <Link to="/products" className="border bg-card px-4 py-2.5 rounded-md font-semibold text-sm">Reorder</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI icon={<Wallet size={18} />} label="30-day spend" value={formatPhp(totalGMV)} hint="+18% vs last 30d" />
          <KPI icon={<Package size={18} />} label="Active orders" value="3" hint="2 in transit" />
          <KPI icon={<FileText size={18} />} label="Open RFQs" value="4" hint="11 quotes pending" />
          <KPI icon={<TrendingUp size={18} />} label="Repeat suppliers" value="6" hint="68% of orders" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Panel title="Recent orders" link="/orders">
            <div className="divide-y">
              {myOrders.map((o) => {
                const s = supplierById(o.supplierId);
                return (
                  <Link key={o.id} to="/orders/$id" params={{ id: o.id }} className="flex items-center gap-3 py-3 hover:bg-muted/40 px-2 -mx-2 rounded">
                    <div className="size-10 rounded-md bg-gradient-to-br from-primary to-gold grid place-items-center text-white font-display">
                      {s.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{o.placed} · {o.escrowState}</div>
                    </div>
                    <div className="text-sm font-semibold">{formatPhp(o.totalPhp)}</div>
                  </Link>
                );
              })}
            </div>
          </Panel>

          <Panel title="My RFQs" link="/rfq">
            <div className="space-y-3">
              {myRfqs.map((r) => (
                <Link key={r.id} to="/rfq/$id" params={{ id: r.id }} className="block border rounded-md p-3 hover:bg-muted/40">
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-sm">{r.title}</div>
                    <span className={`chip ${r.status === "Open" ? "chip-verified" : "chip-gold"}`}>{r.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{r.qty} · {r.responses} quotes · {r.postedAgo}</div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="Suggested reorders">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => {
              const s = supplierById("sup_001");
              return (
                <div key={i} className="border rounded-md p-3">
                  <div className="text-xs text-muted-foreground">Last ordered 14 days ago</div>
                  <div className="font-medium text-sm mt-1">Premium Well-Milled Rice</div>
                  <button className="mt-2 w-full bg-primary text-primary-foreground rounded text-xs font-semibold py-1.5">
                    Reorder 40 sacks
                  </button>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}

function KPI({ icon, label, value, hint }: any) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <div className="text-xs uppercase tracking-wider font-semibold">{label}</div>
        <div className="text-primary">{icon}</div>
      </div>
      <div className="font-display text-2xl mt-2">{value}</div>
      <div className="text-xs text-success mt-0.5">{hint}</div>
    </div>
  );
}

function Panel({ title, link, children }: { title: string; link?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">{title}</h2>
        {link && <Link to={link as any} className="text-xs text-primary font-semibold">View all →</Link>}
      </div>
      {children}
    </div>
  );
}
