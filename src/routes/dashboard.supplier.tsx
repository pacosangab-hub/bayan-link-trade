import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { orders, products, rfqs, formatPhp } from "@/lib/mock-data";
import { TrendingUp, Package, MessageSquare, DollarSign } from "lucide-react";

export const Route = createFileRoute("/dashboard/supplier")({
  head: () => ({ meta: [{ title: "Supplier Dashboard — PSG" }] }),
  component: SupplierDash,
});

function SupplierDash() {
  // Pretend we are supplier sup_001 (Bulacan Grain & Rice Mills)
  const myProducts = products.filter((p) => p.supplierId === "sup_001");
  const incomingRfqs = rfqs.filter((r) => r.category === "Rice & Grains" || r.category === "Flour");

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 flex flex-wrap justify-between items-end gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Supplier dashboard</div>
            <h1 className="font-display text-3xl">Bulacan Grain & Rice Mills Inc.</h1>
            <p className="text-sm text-muted-foreground">Gold supplier · 14 years operating · 4.8★ rating</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-primary text-primary-foreground px-4 py-2.5 rounded-md font-semibold text-sm">
              + Add product
            </button>
            <button className="border bg-card px-4 py-2.5 rounded-md font-semibold text-sm">Promote listing</button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI icon={<DollarSign size={18} />} label="30-day GMV" value="₱1.84M" hint="+24% MoM" />
          <KPI icon={<Package size={18} />} label="Active orders" value="12" hint="3 ready to ship" />
          <KPI icon={<MessageSquare size={18} />} label="Avg response" value="1h 42m" hint="Top 10%" />
          <KPI icon={<TrendingUp size={18} />} label="Reorder rate" value="72%" hint="up 8 pts" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Panel title="Incoming RFQs that match you" link="/rfq">
            <div className="space-y-3">
              {incomingRfqs.map((r) => (
                <Link key={r.id} to="/rfq/$id" params={{ id: r.id }} className="block border rounded-md p-3 hover:bg-muted/40">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">{r.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{r.buyer} · {r.qty}</div>
                    </div>
                    <span className="chip chip-primary shrink-0">Match</span>
                  </div>
                  <button className="mt-2 text-xs font-semibold text-primary">Submit quote →</button>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Orders to fulfill" link="/orders">
            <div className="divide-y">
              {orders.slice(0, 3).map((o) => (
                <Link key={o.id} to="/orders/$id" params={{ id: o.id }} className="flex items-center gap-3 py-3 hover:bg-muted/40 px-2 -mx-2 rounded">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs text-muted-foreground">{o.id.toUpperCase()}</div>
                    <div className="font-medium truncate">{o.buyer}</div>
                    <div className="text-xs">{o.escrowState}</div>
                  </div>
                  <div className="text-sm font-semibold text-primary">{formatPhp(o.totalPhp)}</div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title={`Catalog (${myProducts.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2">Product</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">MOQ</th>
                  <th className="text-right py-2">Stock</th>
                  <th className="text-right py-2">Views (7d)</th>
                  <th className="text-right py-2">Orders (7d)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {myProducts.map((p, i) => (
                  <tr key={p.id} className="border-b">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <img src={p.image} className="size-9 rounded object-cover" alt="" />
                        <span className="font-medium">{p.title}</span>
                      </div>
                    </td>
                    <td className="text-right">{formatPhp(p.pricePhp)}</td>
                    <td className="text-right">{p.moq}</td>
                    <td className="text-right text-success">{p.stock.split("—")[1]?.trim() ?? "—"}</td>
                    <td className="text-right">{(420 + i * 87).toLocaleString()}</td>
                    <td className="text-right">{12 + i * 4}</td>
                    <td className="text-right">
                      <button className="text-primary font-semibold text-xs">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Payouts">
          <div className="grid sm:grid-cols-3 gap-3">
            <Stat label="Released this month" value="₱1.42M" />
            <Stat label="Held in escrow" value="₱348K" />
            <Stat label="Next payout" value="Friday" />
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
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl mt-1">{value}</div>
    </div>
  );
}
