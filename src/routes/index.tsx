import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard, SupplierCard, RFQCard, SectionHeader } from "@/components/ui-bits";
import { categories, products, suppliers, rfqs } from "@/lib/mock-data";
import { ArrowRight, ShieldCheck, FileText, Truck, Wallet, Users, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PSG — Philippine Supply Gateway" },
      { name: "description", content: "Source verified Philippine suppliers, post RFQs, and transact with escrow protection." },
      { property: "og:title", content: "PSG — Philippine Supply Gateway" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <AppShell>
      {/* Hero */}
      <section className="gradient-hero text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-20 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold mb-4">
              🇵🇭 50+ verified suppliers · 500+ SKUs · Metro Manila
            </div>
            <h1 className="font-display text-5xl md:text-7xl leading-[0.95] tracking-wide">
              Source smarter.<br />
              <span className="text-[oklch(0.95_0.12_85)]">Sell wider.</span>
            </h1>
            <p className="mt-5 text-lg text-white/90 max-w-lg">
              PSG Supply Gateway connects business buyers with trusted manufacturers, wholesalers, distributors, and logistics partners to source products, request custom quotes, manage orders, and pay safely through escrow.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/products" className="bg-white text-primary font-semibold px-6 py-3 rounded-md hover:bg-white/95 inline-flex items-center gap-2">
                Browse marketplace <ArrowRight size={18} />
              </Link>
              <Link to="/rfq" className="bg-ink/40 backdrop-blur border border-white/30 text-white font-semibold px-6 py-3 rounded-md hover:bg-ink/60">
                Post a Request for Quotation
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm">
              <Trust icon={<ShieldCheck size={16} />} label="Escrow on every order" />
              <Trust icon={<FileText size={16} />} label="DTI / SEC / BIR verified" />
              <Trust icon={<Truck size={16} />} label="Seller-fulfilled, transparent" />
            </div>
          </div>
          <div className="hidden md:block relative">
            <div className="grid grid-cols-2 gap-3">
              {products.slice(0, 4).map((p, i) => (
                <div key={p.id} className={`rounded-xl overflow-hidden shadow-2xl ${i % 2 ? "translate-y-6" : ""}`}>
                  <img src={p.image} alt={p.title} className="w-full aspect-square object-cover" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories strip */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <SectionHeader eyebrow="Shop by need" title="Categories" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3">
          {categories.map((c) => (
            <Link
              key={c.name}
              to="/products"
              search={{ category: c.name } as any}
              className="rounded-lg border bg-card p-3 text-center hover:border-primary hover:shadow-sm transition-all"
            >
              <div className="text-3xl">{c.icon}</div>
              <div className="text-xs font-medium mt-1.5 leading-tight">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* RFQ Highlight */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 grid md:grid-cols-3 gap-10 items-center">
          <div className="md:col-span-1">
            <div className="text-xs uppercase tracking-[0.2em] text-[oklch(0.78_0.15_75)] font-semibold mb-2">
              RFQ Marketplace
            </div>
            <h2 className="font-display text-4xl mb-3">Need it big? Let suppliers bid.</h2>
            <p className="text-white/80 mb-5">
              Post one request, get multiple competing quotes within hours. Compare price, MOQ, lead time, and rating side-by-side.
            </p>
            <Link to="/rfq" className="bg-primary px-5 py-2.5 rounded-md font-semibold inline-flex items-center gap-2">
              Browse open RFQs <ArrowRight size={16} />
            </Link>
          </div>
          <div className="md:col-span-2 space-y-3">
            {rfqs.slice(0, 3).map((r) => (
              <div key={r.id} className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
                <Link to="/rfq/$id" params={{ id: r.id }} className="block">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-[oklch(0.78_0.15_75)] font-semibold uppercase">{r.category}</div>
                      <div className="font-semibold mt-0.5">{r.title}</div>
                      <div className="text-xs text-white/70 mt-1">{r.buyer} · {r.qty}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-white/60">{r.postedAgo}</div>
                      <div className="mt-1 font-bold text-[oklch(0.78_0.15_75)]">{r.responses} quotes</div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHeader
          eyebrow="Trending on PSG"
          title="Featured products"
          action={
            <Link to="/products" className="text-sm font-semibold text-primary inline-flex items-center gap-1">
              See all <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/40 border-y">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <SectionHeader eyebrow="How PSG works" title="From discovery to delivery" />
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { n: "01", icon: <Users size={22} />, t: "Find a supplier", d: "Search products or post an RFQ. Filter by region, MOQ, and verification." },
              { n: "02", icon: <Wallet size={22} />, t: "Pay into escrow", d: "PSG holds your funds. Supplier won't get paid until you confirm delivery." },
              { n: "03", icon: <Truck size={22} />, t: "Supplier fulfills", d: "Track shipment status. Message the supplier directly inside PSG." },
              { n: "04", icon: <ShieldCheck size={22} />, t: "Confirm & release", d: "Inspect the goods, confirm delivery, and escrow releases to the supplier." },
            ].map((s) => (
              <div key={s.n} className="bg-card rounded-lg p-5 border">
                <div className="flex items-center justify-between mb-3">
                  <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center">{s.icon}</div>
                  <div className="font-display text-3xl text-primary/30">{s.n}</div>
                </div>
                <div className="font-semibold mb-1">{s.t}</div>
                <div className="text-sm text-muted-foreground">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured suppliers */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <SectionHeader
          eyebrow="Verified network"
          title="Featured suppliers"
          action={
            <Link to="/suppliers" className="text-sm font-semibold text-primary inline-flex items-center gap-1">
              All suppliers <ArrowRight size={14} />
            </Link>
          }
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.slice(0, 6).map((s) => <SupplierCard key={s.id} s={s} />)}
        </div>
      </section>

      {/* Become a supplier CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="rounded-2xl gradient-hero text-white p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] font-semibold mb-2 opacity-90">For suppliers</div>
            <h2 className="font-display text-4xl md:text-5xl leading-[1] mb-3">Sell to all of Philippine business.</h2>
            <p className="text-white/90 max-w-md">
              Free onboarding. Verified-supplier badge after KYC. Get RFQs from restaurants, hotels, pharmacies, and contractors — paid through escrow.
            </p>
          </div>
          <div className="md:justify-self-end space-y-3 w-full max-w-sm">
            <Link to="/onboarding/supplier" className="bg-white text-primary font-semibold px-5 py-3 rounded-md text-center block hover:bg-white/95">
              Apply to become a supplier
            </Link>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <Stat n="<2hr" l="Avg response" />
              <Stat n="₱4M+" l="Monthly GMV" />
              <Stat n="68%" l="Reorder rate" />
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-white/95">
      <span className="text-[oklch(0.95_0.12_85)]">{icon}</span>
      {label}
    </span>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-md py-2">
      <div className="font-display text-xl">{n}</div>
      <div className="text-[10px] uppercase tracking-wider opacity-80">{l}</div>
    </div>
  );
}
