import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Rating, VerifiedBadge, ProductCard } from "@/components/ui-bits";
import { productById, supplierById, products, formatPhp } from "@/lib/mock-data";
import { addToCart, toggleSaved, useSaved, shippingTable, type ShippingDest } from "@/lib/cart";
import {
  Truck, ShieldCheck, MessageSquare, Package, MapPin, Heart, ShoppingCart, Zap,
  FileText, ZoomIn, PlayCircle, Award, Building2, Clock, CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

type Tab = "Description" | "Specifications" | "Certificates" | "Reviews" | "Supplier" | "Shipping";

function ProductDetail() {
  const { product: p } = Route.useLoaderData();
  const s = supplierById(p.supplierId);
  const navigate = useNavigate();
  const saved = useSaved();
  const isSaved = saved.includes(p.id);

  const [qty, setQty] = useState(p.moq);
  const [dest, setDest] = useState<ShippingDest | "">("");
  const [tab, setTab] = useState<Tab>("Description");
  const [zoom, setZoom] = useState(false);

  // Build a small gallery + extras from the base image with different crops/orientations.
  const baseUrl = p.image.split("?")[0];
  const gallery = [
    `${baseUrl}?auto=format&fit=crop&w=1200&q=80`,
    `${baseUrl}?auto=format&fit=crop&w=1200&q=80&crop=top`,
    `${baseUrl}?auto=format&fit=crop&w=1200&q=80&crop=bottom`,
    `${baseUrl}?auto=format&fit=crop&w=1200&q=80&sat=-20`,
  ];
  const [activeImg, setActiveImg] = useState(gallery[0]);

  const tier = [...p.tierPricing].reverse().find((t) => qty >= t.qty) ?? p.tierPricing[0];
  const subtotal = tier.price * qty;
  const ship = dest ? shippingTable[dest] : null;
  const total = subtotal + (ship?.cost ?? 0);

  const related = products.filter((x) => x.id !== p.id).slice(0, 5);

  function handleAddToCart() {
    addToCart(p.id, qty);
    toast.success(`Added ${qty} ${p.unit} to cart`, {
      description: p.title,
      action: { label: "Checkout", onClick: () => navigate({ to: "/checkout" }) },
    });
  }

  function handleBuyNow() {
    addToCart(p.id, qty);
    navigate({ to: "/checkout" });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted-foreground">
        <Link to="/products" className="hover:text-primary">Marketplace</Link> ›{" "}
        <Link to="/products" className="hover:text-primary">{p.category}</Link> ›{" "}
        <span className="text-foreground">{p.title}</span>
      </div>

      <div className="mx-auto max-w-7xl px-4 grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Gallery + details */}
        <div>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Gallery */}
            <div>
              <button
                onClick={() => setZoom(true)}
                className="group relative aspect-square w-full rounded-lg overflow-hidden border bg-muted block"
              >
                <img src={activeImg} alt={p.title} className="w-full h-full object-cover" />
                <span className="absolute top-3 right-3 bg-background/90 rounded-md px-2 py-1 text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <ZoomIn size={14} /> Click to zoom
                </span>
                <span className="absolute top-3 left-3 chip chip-verified">Authentic stock photo</span>
              </button>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {gallery.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(g)}
                    className={`aspect-square rounded-md overflow-hidden border-2 ${activeImg === g ? "border-primary" : "border-transparent"}`}
                  >
                    <img src={g} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
                <button
                  onClick={() => toast.info("Product video — coming soon", { description: "Suppliers can upload 30s product videos." })}
                  className="aspect-square rounded-md border-2 border-dashed grid place-items-center text-muted-foreground hover:border-primary hover:text-primary"
                >
                  <PlayCircle size={22} />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <ExtraCard icon={<Award size={14} />} label="3 certificates" sub="FDA · HACCP · DTI" />
                <ExtraCard icon={<Package size={14} />} label="Packaging photos" sub="Pallet + sack view" />
              </div>
            </div>

            {/* Header info */}
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
              <div className="mt-1 text-sm">
                <Link to="/suppliers/$id" params={{ id: s.id }} className="text-primary font-semibold hover:underline">
                  {s.name}
                </Link>
              </div>

              <div className="mt-5 rounded-lg border bg-muted/40 p-4">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                  Tier pricing
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {p.tierPricing.map((t) => (
                    <button
                      key={t.qty}
                      onClick={() => setQty(Math.max(t.qty, p.moq))}
                      className={`rounded p-2 text-center border ${qty >= t.qty ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted"}`}
                    >
                      <div className="text-xs text-muted-foreground">≥ {t.qty}</div>
                      <div className="font-display text-xl text-primary">{formatPhp(t.price)}</div>
                      <div className="text-[10px] text-muted-foreground">/ {p.unit}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Spec icon={<Package size={16} />} label="MOQ" value={`${p.moq} ${p.unit}`} />
                <Spec icon={<CheckCircle2 size={16} />} label="Available stock" value="1,250 sacks" />
                <Spec icon={<Truck size={16} />} label="Lead time" value={`${p.leadTimeDays}-${p.leadTimeDays + 2} days`} />
                <Spec icon={<MapPin size={16} />} label="Ships from" value={p.origin} />
              </div>

              <div className="mt-4 text-sm text-success flex items-center gap-1">
                <CheckCircle2 size={14} /> {p.stock}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-10">
            <div className="border-b flex overflow-x-auto">
              {(["Description", "Specifications", "Certificates", "Reviews", "Supplier", "Shipping"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                    tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="py-6">
              {tab === "Description" && (
                <div className="prose max-w-none text-sm leading-relaxed text-foreground/90">
                  <p>{p.description}</p>
                  <p className="mt-3">
                    Sourced direct from {p.origin}. Pre-graded, shrink-wrapped, and palletized for foodservice and retail.
                    Quality consistency guaranteed batch-to-batch. PSG escrow holds funds until you confirm receipt.
                  </p>
                </div>
              )}
              {tab === "Specifications" && (
                <table className="w-full text-sm">
                  <tbody>
                    {[
                      ["Origin", p.origin],
                      ["Grade", "Premium"],
                      ["Moisture", "14%"],
                      ["Packaging", p.unit],
                      ["Shelf life", "6 months"],
                      ["Category", p.category],
                      ["HS code", "1006.30.99"],
                    ].map(([k, v]) => (
                      <tr key={k} className="border-b">
                        <td className="py-2 text-muted-foreground w-1/3">{k}</td>
                        <td className="py-2 font-medium">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {tab === "Certificates" && (
                <div className="grid sm:grid-cols-3 gap-3">
                  {["FDA Registration", "HACCP Compliance", "DTI Business Permit"].map((c) => (
                    <div key={c} className="rounded-lg border p-4 flex items-center gap-3 hover:shadow-md transition">
                      <div className="size-10 rounded bg-primary/10 text-primary grid place-items-center">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm">{c}</div>
                        <div className="text-xs text-muted-foreground">PDF · Verified by PSG</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {tab === "Reviews" && (
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
              )}
              {tab === "Supplier" && <SupplierTabCard supplierId={s.id} />}
              {tab === "Shipping" && (
                <div className="text-sm space-y-3">
                  <p>Ships from <strong>{p.origin}</strong> via PSG-partnered logistics. Escrow only releases after delivery confirmation.</p>
                  <table className="w-full border rounded overflow-hidden">
                    <thead className="bg-muted text-xs uppercase text-muted-foreground">
                      <tr><th className="text-left px-3 py-2">Destination</th><th className="text-right px-3 py-2">Cost</th><th className="text-right px-3 py-2">ETA</th></tr>
                    </thead>
                    <tbody>
                      {Object.entries(shippingTable).map(([k, v]) => (
                        <tr key={k} className="border-t"><td className="px-3 py-2">{k}</td><td className="px-3 py-2 text-right font-medium">{formatPhp(v.cost)}</td><td className="px-3 py-2 text-right text-muted-foreground">{v.days}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Supplier card */}
          <div className="mt-2">
            <h2 className="font-display text-2xl mb-3">About this supplier</h2>
            <SupplierTabCard supplierId={s.id} />
          </div>

          {/* Related */}
          <div className="mt-12">
            <h2 className="font-display text-2xl mb-1">Customers also bought</h2>
            <p className="text-sm text-muted-foreground mb-4">Buyers in {p.category} typically reorder these together.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {related.map((r) => <ProductCard key={r.id} p={r} />)}
            </div>
          </div>
        </div>

        {/* Order panel */}
        <aside className="lg:sticky lg:top-32 self-start space-y-3">
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Order quantity</div>
            <div className="mt-2 flex items-center gap-2">
              <button onClick={() => setQty(Math.max(p.moq, qty - 1))} className="size-9 border rounded font-bold hover:bg-muted">−</button>
              <input
                type="number"
                value={qty}
                min={p.moq}
                onChange={(e) => setQty(Math.max(p.moq, parseInt(e.target.value || `${p.moq}`)))}
                className="flex-1 border rounded text-center py-2"
              />
              <button onClick={() => setQty(qty + 1)} className="size-9 border rounded font-bold hover:bg-muted">+</button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">in {p.unit} · min {p.moq}</div>

            <div className="mt-4">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1">
                <Truck size={12} /> Ship to
              </label>
              <select
                value={dest}
                onChange={(e) => setDest(e.target.value as ShippingDest | "")}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm bg-card"
              >
                <option value="">Select destination</option>
                {Object.keys(shippingTable).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              {ship && (
                <div className="mt-2 text-xs text-success flex items-center justify-between bg-success/5 rounded-md px-2 py-1.5">
                  <span className="flex items-center gap-1"><CheckCircle2 size={12} /> {ship.days}</span>
                  <span className="font-semibold">{formatPhp(ship.cost)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-1 text-sm">
              <Row label={`${qty} × ${formatPhp(tier.price)}`} value={formatPhp(subtotal)} />
              <Row label="Shipping" value={ship ? formatPhp(ship.cost) : "Select dest."} sub />
            </div>
            <div className="border-t mt-3 pt-3 flex items-baseline justify-between">
              <span className="text-sm">Total</span>
              <span className="font-display text-2xl text-primary">{formatPhp(total)}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={handleBuyNow}
                className="col-span-2 bg-primary text-primary-foreground font-semibold rounded-md py-3 hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <Zap size={16} /> Buy Now
              </button>
              <button
                onClick={handleAddToCart}
                className="border-2 border-primary text-primary font-semibold rounded-md py-2.5 hover:bg-primary/5 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={16} /> Add to Cart
              </button>
              <Link
                to="/rfq/new"
                className="border rounded-md py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-muted"
              >
                <FileText size={14} /> Request Quote
              </Link>
              <Link
                to="/messages"
                className="border rounded-md py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-muted"
              >
                <MessageSquare size={14} /> Chat Supplier
              </Link>
              <button
                onClick={() => {
                  toggleSaved(p.id);
                  toast.success(isSaved ? "Removed from saved" : "Saved");
                }}
                className={`border rounded-md py-2.5 text-sm font-semibold flex items-center justify-center gap-2 ${isSaved ? "bg-primary/5 text-primary border-primary" : "hover:bg-muted"}`}
              >
                <Heart size={14} className={isSaved ? "fill-primary" : ""} /> {isSaved ? "Saved" : "Save"}
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-success">
              <ShieldCheck size={14} /> Funds held by PSG until you confirm delivery.
            </div>
          </div>
        </aside>
      </div>
      <div className="h-16" />

      {/* Zoom modal */}
      {zoom && (
        <div
          onClick={() => setZoom(false)}
          className="fixed inset-0 bg-black/85 z-50 grid place-items-center p-4 cursor-zoom-out animate-fade-in"
        >
          <img src={activeImg} alt={p.title} className="max-h-[92vh] max-w-[92vw] object-contain rounded-lg" />
        </div>
      )}
    </AppShell>
  );
}

function SupplierTabCard({ supplierId }: { supplierId: string }) {
  const s = supplierById(supplierId);
  return (
    <Link
      to="/suppliers/$id"
      params={{ id: s.id }}
      className="block rounded-lg border bg-card p-5 hover:shadow-md transition"
    >
      <div className="flex items-start gap-4">
        <div className="size-14 rounded-md bg-gradient-to-br from-primary to-gold grid place-items-center text-white font-display text-2xl shrink-0">
          {s.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold">{s.name}</span>
            {s.verified && <VerifiedBadge />}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <Building2 size={12} /> {s.type} · {s.location} · Member since {2026 - s.yearsOperating}
          </div>
          <div className="mt-1"><Rating value={s.rating} count={s.reviews} /></div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <Mini n={s.transactions.toLocaleString()} l="Orders completed" />
        <Mini n="99%" l="Response rate" />
        <Mini n={s.responseTime} l={<><Clock size={10} className="inline" /> Response</>} />
      </div>
      <div className="mt-3 text-sm text-primary font-semibold">View supplier page →</div>
    </Link>
  );
}

function ExtraCard({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <div className="rounded-md border bg-card p-2.5">
      <div className="text-xs font-semibold flex items-center gap-1.5">{icon} {label}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>
    </div>
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
function Mini({ n, l }: { n: string; l: React.ReactNode }) {
  return (
    <div className="rounded bg-muted py-2">
      <div className="font-semibold text-sm">{n}</div>
      <div className="text-[10px] uppercase text-muted-foreground">{l}</div>
    </div>
  );
}
