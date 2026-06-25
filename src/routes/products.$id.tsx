import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Rating, VerifiedBadge, ProductCard } from "@/components/ui-bits";
import { productById, supplierById, products, formatPhp } from "@/lib/mock-data";
import { Truck, ShieldCheck, MessageSquare, Package, MapPin } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/products/$id")({
  loader: ({ params }) => {
    const p = products.find((x) => x.id === params.id);
    if (!p) throw notFound();
    return { product: p };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.product.title ?? "Product"} — PSG` }],
  }),
  notFoundComponent: () => (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-4xl">Product not found</h1>
        <Link to="/products" className="mt-4 inline-block text-primary font-semibold">← Back to marketplace</Link>
      </div>
    </AppShell>
  ),
  errorComponent: ({ reset }) => (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Couldn't load product</h1>
        <button onClick={reset} className="mt-4 px-4 py-2 bg-primary text-white rounded">Retry</button>
      </div>
    </AppShell>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { product: p } = Route.useLoaderData();
  const s = supplierById(p.supplierId);
  const [qty, setQty] = useState(p.moq);
  const tier = [...p.tierPricing].reverse().find((t) => qty >= t.qty) ?? p.tierPricing[0];
  const total = tier.price * qty;
  const related = products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 text-xs text-muted-foreground">
        <Link to="/products" className="hover:text-primary">Marketplace</Link> ›{" "}
        <Link to="/products" search={{ category: p.category } as any} className="hover:text-primary">{p.category}</Link> ›{" "}
        <span className="text-foreground">{p.title}</span>
      </div>

      <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-[1fr_380px] gap-8">
        {/* Gallery + details */}
        <div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
              <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {s.verified && <VerifiedBadge />}
                {s.goldSupplier && <VerifiedBadge gold />}
                <span className="chip">From {p.origin}</span>
              </div>
              <h1 className="font-display text-3xl leading-tight">{p.title}</h1>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <Rating value={s.rating} count={s.reviews} />
                <span className="text-muted-foreground">{s.transactions.toLocaleString()} orders</span>
              </div>

              <div className="mt-5 rounded-lg border bg-muted/40 p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Tier pricing
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {p.tierPricing.map((t: { qty: number; price: number }) => (
                    <div key={t.qty} className={`rounded p-2 text-center border ${qty >= t.qty ? "border-primary bg-primary/5" : "border-transparent"}`}>
                      <div className="text-xs text-muted-foreground">≥ {t.qty}</div>
                      <div className="font-display text-xl text-primary">{formatPhp(t.price)}</div>
                      <div className="text-[10px] text-muted-foreground">/ {p.unit}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <Spec icon={<Package size={16} />} label="MOQ" value={`${p.moq} ${p.unit}`} />
                <Spec icon={<Truck size={16} />} label="Lead time" value={`${p.leadTimeDays} days`} />
                <Spec icon={<MapPin size={16} />} label="Ships from" value={p.origin} />
              </div>

              <div className="mt-5">
                <div className="text-sm font-semibold mb-1">Description</div>
                <p className="text-sm text-muted-foreground">{p.description}</p>
              </div>

              <div className="mt-4 text-sm text-success">● {p.stock}</div>
            </div>
          </div>

          {/* Reviews */}
          <div className="mt-12">
            <h2 className="font-display text-2xl mb-3">Buyer reviews</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { buyer: "Carlo's Lechon House", text: "Consistent quality, never short. Driver is always on time.", rating: 5 },
                { buyer: "Hotel Antonio", text: "Saved us 12% vs our previous supplier. Escrow gave us confidence on first order.", rating: 5 },
                { buyer: "BarakoBros Coffee", text: "Great communication via PSG chat. Will reorder monthly.", rating: 4 },
                { buyer: "Sunrise Pharmacy", text: "Good for the price. Packaging could be a bit stronger.", rating: 4 },
              ].map((r, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm">{r.buyer}</div>
                    <Rating value={r.rating} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{r.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Related */}
          <div className="mt-12">
            <h2 className="font-display text-2xl mb-3">More in {p.category}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {related.map((r) => <ProductCard key={r.id} p={r} />)}
            </div>
          </div>
        </div>

        {/* Order panel */}
        <aside className="lg:sticky lg:top-32 self-start space-y-4">
          <div className="rounded-lg border bg-card p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Order quantity</div>
            <div className="mt-2 flex items-center gap-2">
              <button onClick={() => setQty(Math.max(p.moq, qty - p.moq))} className="size-9 border rounded font-bold">−</button>
              <input
                type="number"
                value={qty}
                min={p.moq}
                onChange={(e) => setQty(Math.max(p.moq, parseInt(e.target.value || `${p.moq}`)))}
                className="flex-1 border rounded text-center py-2"
              />
              <button onClick={() => setQty(qty + p.moq)} className="size-9 border rounded font-bold">+</button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">in {p.unit} · min {p.moq}</div>

            <div className="mt-4 space-y-1 text-sm">
              <Row label={`${qty} × ${formatPhp(tier.price)}`} value={formatPhp(total)} />
              <Row label="Est. logistics" value="Quoted at checkout" sub />
              <Row label="PSG fee (3%)" value={formatPhp(Math.round(total * 0.03))} sub />
            </div>
            <div className="border-t mt-3 pt-3 flex items-baseline justify-between">
              <span className="text-sm">Escrow total</span>
              <span className="font-display text-2xl text-primary">{formatPhp(total + Math.round(total * 0.03))}</span>
            </div>

            <Link
              to="/orders/$id"
              params={{ id: "ord_24011" }}
              className="mt-4 w-full bg-primary text-primary-foreground font-semibold rounded-md py-3 text-center block hover:bg-primary/90"
            >
              Pay into escrow
            </Link>
            <button className="mt-2 w-full border rounded-md py-2.5 text-sm font-semibold">
              Request a sample
            </button>

            <div className="mt-4 flex items-center gap-2 text-xs text-success">
              <ShieldCheck size={14} /> Funds held by PSG until you confirm delivery.
            </div>
          </div>

          {/* Supplier card */}
          <Link to="/suppliers/$id" params={{ id: s.id }} className="block rounded-lg border bg-card p-4 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-md bg-gradient-to-br from-primary to-gold grid place-items-center text-white font-display text-lg">
                {s.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.type} · {s.location}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <Mini n={`${s.yearsOperating}y`} l="Operating" />
              <Mini n={s.responseTime} l="Response" />
              <Mini n={`${Math.round((s.repeatBuyers / s.transactions) * 100) || 0}%`} l="Repeat" />
            </div>
          </Link>

          <Link to="/messages" className="w-full border rounded-md py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-muted">
            <MessageSquare size={16} /> Message supplier
          </Link>
        </aside>
      </div>
      <div className="h-16" />
    </AppShell>
  );
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-2.5">
      <div className="text-xs text-muted-foreground flex items-center gap-1">{icon} {label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}
function Row({ label, value, sub }: { label: string; value: string; sub?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${sub ? "text-muted-foreground text-xs" : ""}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
function Mini({ n, l }: { n: string; l: string }) {
  return (
    <div className="rounded bg-muted py-1.5">
      <div className="font-semibold text-sm">{n}</div>
      <div className="text-[10px] uppercase text-muted-foreground">{l}</div>
    </div>
  );
}
