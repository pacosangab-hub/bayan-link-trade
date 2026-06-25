import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard, Rating, VerifiedBadge } from "@/components/ui-bits";
import { suppliers, products } from "@/lib/mock-data";
import { MapPin, Clock, Truck, FileText, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/suppliers/$id")({
  loader: ({ params }) => {
    const s = suppliers.find((x) => x.id === params.id);
    if (!s) throw notFound();
    return { supplier: s };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.supplier.name ?? "Supplier"} — PSG` }],
  }),
  notFoundComponent: () => (
    <AppShell>
      <div className="px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Supplier not found</h1>
        <Link to="/suppliers" className="mt-4 inline-block text-primary">← Back</Link>
      </div>
    </AppShell>
  ),
  errorComponent: ({ reset }) => (
    <AppShell><div className="p-12 text-center"><button onClick={reset}>Retry</button></div></AppShell>
  ),
  component: SupplierDetail,
});

function SupplierDetail() {
  const { supplier: s } = Route.useLoaderData();
  const items = products.filter((p) => p.supplierId === s.id);

  return (
    <AppShell>
      {/* Cover */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        <img src={s.cover} alt={s.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 -mt-20 relative z-10">
        <div className="bg-card border rounded-lg p-5 md:p-6 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="size-20 rounded-lg bg-gradient-to-br from-primary to-gold grid place-items-center text-white font-display text-4xl shrink-0">
              {s.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap gap-2 mb-1">
                {s.verified && <VerifiedBadge />}
                {s.goldSupplier && <VerifiedBadge gold />}
                <span className="chip">{s.type}</span>
                <span className="chip">{s.yearsOperating} yrs operating</span>
              </div>
              <h1 className="font-display text-3xl leading-tight">{s.name}</h1>
              <div className="text-sm text-muted-foreground mt-1 flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1"><MapPin size={14} /> {s.location}</span>
                <span className="inline-flex items-center gap-1"><Clock size={14} /> Responds {s.responseTime}</span>
                <span className="inline-flex items-center gap-1"><Truck size={14} /> Lead time {s.leadTime}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/messages" className="border rounded-md px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:bg-muted">
                <MessageSquare size={14} /> Message
              </Link>
              <Link to="/rfq/new" className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold">
                Request quote
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t">
            <Stat n={s.rating.toFixed(1)} l="Rating" />
            <Stat n={s.reviews.toString()} l="Reviews" />
            <Stat n={s.transactions.toLocaleString()} l="Orders" />
            <Stat n={s.repeatBuyers.toString()} l="Repeat buyers" />
            <Stat n={`${Math.round((s.repeatBuyers / s.transactions) * 100)}%`} l="Reorder rate" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 grid lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <h2 className="font-display text-2xl mb-3">Catalog ({items.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>

          <h2 className="font-display text-2xl mt-12 mb-3">About</h2>
          <p className="text-muted-foreground">{s.description}</p>

          <h2 className="font-display text-2xl mt-10 mb-3">Recent reviews</h2>
          <div className="space-y-3">
            {[
              { buyer: "Hotel Antonio", text: "Reliable for 8 months running. Quality is consistent.", rating: 5 },
              { buyer: "Carlo's Lechon House", text: "First order via escrow felt safe. Continued ever since.", rating: 5 },
              { buyer: "Cafe Lola", text: "Good supplier. Communication slightly slow on Sundays.", rating: 4 },
            ].map((r, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{r.buyer}</div>
                  <Rating value={r.rating} />
                </div>
                <p className="text-sm text-muted-foreground mt-1">{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2 mb-3">
              <FileText size={14} /> Verified credentials
            </div>
            <ul className="space-y-2">
              {s.permits.map((p: string) => (
                <li key={p} className="flex items-center justify-between text-sm">
                  <span>{p}</span>
                  <span className="chip chip-verified">Verified</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Categories</div>
            <div className="flex flex-wrap gap-1.5">
              {s.categories.map((c: string) => <span key={c} className="chip chip-primary">{c}</span>)}
            </div>
          </div>

          <div className="rounded-lg gradient-ink text-white p-5">
            <div className="text-xs uppercase tracking-wider text-[oklch(0.78_0.15_75)] font-semibold mb-2">
              Trust signals
            </div>
            <ul className="text-sm space-y-1.5 opacity-90">
              <li>● Bank-verified payouts</li>
              <li>● 100% escrow-mediated</li>
              <li>● 0 active disputes</li>
              <li>● PSG since 2024</li>
            </ul>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="text-center">
      <div className="font-display text-2xl">{n}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
    </div>
  );
}
