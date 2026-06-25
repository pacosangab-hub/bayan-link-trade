import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { EscrowTimeline } from "@/components/ui-bits";
import { orders, supplierById, productById, formatPhp } from "@/lib/mock-data";
import { MessageSquare, Truck, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/orders/$id")({
  loader: ({ params }) => {
    const o = orders.find((x) => x.id === params.id);
    if (!o) throw notFound();
    return { order: o };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `Order ${loaderData?.order.id ?? ""} — PSG` }] }),
  notFoundComponent: () => (<AppShell><div className="p-20 text-center">Order not found</div></AppShell>),
  errorComponent: ({ reset }) => (<AppShell><div className="p-12 text-center"><button onClick={reset}>Retry</button></div></AppShell>),
  component: OrderDetail,
});

function OrderDetail() {
  const { order: o } = Route.useLoaderData();
  const s = supplierById(o.supplierId);

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Link to="/orders" className="text-xs text-muted-foreground hover:text-primary">← All orders</Link>
          <div className="flex flex-wrap items-end justify-between gap-3 mt-2">
            <div>
              <h1 className="font-display text-3xl">Order {o.id.toUpperCase()}</h1>
              <div className="text-sm text-muted-foreground">Placed {o.placed} · with {s.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Escrow holding</div>
              <div className="font-display text-3xl text-primary">{formatPhp(o.totalPhp)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-6">
          {/* Items */}
          <div className="rounded-lg border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b font-semibold">Items</div>
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr><th className="text-left px-4 py-2">Product</th><th className="text-right px-4 py-2">Qty</th><th className="text-right px-4 py-2">Unit</th><th className="text-right px-4 py-2">Total</th></tr>
              </thead>
              <tbody>
                {o.items.map((it: { productId: string; qty: number; price: number }, i: number) => {
                  const p = productById(it.productId);
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt="" className="size-12 rounded object-cover" />
                          <div>
                            <div className="font-medium">{p.title}</div>
                            <div className="text-xs text-muted-foreground">{p.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{it.qty}</td>
                      <td className="px-4 py-3 text-right">{formatPhp(it.price)}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatPhp(it.qty * it.price)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t bg-muted/40 text-sm space-y-1">
              <Row label="Subtotal" value={formatPhp(o.totalPhp)} />
              <Row label="PSG escrow fee (3%)" value={formatPhp(Math.round(o.totalPhp * 0.03))} sub />
              <div className="flex items-center justify-between pt-2 border-t mt-2">
                <span className="font-semibold">Held in escrow</span>
                <span className="font-display text-xl text-primary">{formatPhp(o.totalPhp + Math.round(o.totalPhp * 0.03))}</span>
              </div>
            </div>
          </div>

          {/* Tracking */}
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Fulfillment timeline</h2>
              <span className="chip chip-primary inline-flex items-center gap-1">
                <Truck size={12} /> Seller-fulfilled
              </span>
            </div>
            <EscrowTimeline state={o.escrowState} />
            {o.trackingNote && (
              <div className="mt-5 rounded-md bg-muted p-3 text-sm">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Latest update</div>
                {o.trackingNote}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid sm:grid-cols-3 gap-3">
            {o.escrowState === "Delivered — Awaiting Confirmation" && (
              <button className="bg-success text-success-foreground font-semibold rounded-md py-3">
                ✓ Confirm delivery & release
              </button>
            )}
            <Link to="/messages" className="border rounded-md py-3 text-sm font-semibold flex items-center justify-center gap-2">
              <MessageSquare size={14} /> Message supplier
            </Link>
            <button className="border border-destructive/40 text-destructive rounded-md py-3 text-sm font-semibold flex items-center justify-center gap-2">
              <ShieldAlert size={14} /> Open a dispute
            </button>
          </div>
        </div>

        {/* Side */}
        <aside className="space-y-4">
          <Link to="/suppliers/$id" params={{ id: s.id }} className="block rounded-lg border bg-card p-4 hover:shadow-md">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Supplier</div>
            <div className="font-semibold">{s.name}</div>
            <div className="text-xs text-muted-foreground">{s.location}</div>
            <div className="text-xs mt-2">Response time: {s.responseTime}</div>
          </Link>

          <div className="rounded-lg border bg-card p-4 text-sm space-y-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Delivery to</div>
            <div>Lola Nena's Commissary</div>
            <div className="text-muted-foreground text-xs">14 Roces Ave, Project 8, Quezon City</div>
          </div>

          <div className="rounded-lg gradient-ink text-white p-4 text-sm">
            <div className="text-xs uppercase tracking-wider text-[oklch(0.78_0.15_75)] font-semibold mb-2">Escrow protection</div>
            <p className="opacity-90">Funds are held by PSG until you confirm delivery. Open a dispute within 72 hours if there's an issue — we'll mediate.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${sub ? "text-xs text-muted-foreground" : ""}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
