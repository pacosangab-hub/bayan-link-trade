import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/ui-bits";
import { products, categories, regions, supplierTypes, suppliers } from "@/lib/mock-data";
import { SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/products")({
  head: () => ({ meta: [{ title: "Products — PSG Marketplace" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const [cat, setCat] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [maxMoq, setMaxMoq] = useState<number>(500);

  const filtered = products.filter((p) => {
    const s = suppliers.find((x) => x.id === p.supplierId)!;
    if (cat && p.category !== cat) return false;
    if (region && s.region !== region) return false;
    if (type && s.type !== type) return false;
    if (verifiedOnly && !s.verified) return false;
    if (p.moq > maxMoq) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="font-display text-3xl">Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} products · seller-fulfilled · escrow-protected
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[260px_1fr] gap-6">
        {/* Filters */}
        <aside className="space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal size={16} /> Filters
          </div>

          <FilterGroup label="Category">
            <FilterRow active={cat === null} onClick={() => setCat(null)}>All</FilterRow>
            {categories.map((c) => (
              <FilterRow key={c.name} active={cat === c.name} onClick={() => setCat(c.name)}>
                {c.icon} {c.name}
              </FilterRow>
            ))}
          </FilterGroup>

          <FilterGroup label="Region">
            <FilterRow active={region === null} onClick={() => setRegion(null)}>All regions</FilterRow>
            {regions.map((r) => (
              <FilterRow key={r} active={region === r} onClick={() => setRegion(r)}>{r}</FilterRow>
            ))}
          </FilterGroup>

          <FilterGroup label="Supplier type">
            <FilterRow active={type === null} onClick={() => setType(null)}>Any</FilterRow>
            {supplierTypes.map((t) => (
              <FilterRow key={t} active={type === t} onClick={() => setType(t)}>{t}</FilterRow>
            ))}
          </FilterGroup>

          <FilterGroup label="Trust">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
              Verified suppliers only
            </label>
          </FilterGroup>

          <FilterGroup label={`Max MOQ — ${maxMoq}`}>
            <input
              type="range"
              min={5}
              max={500}
              step={5}
              value={maxMoq}
              onChange={(e) => setMaxMoq(parseInt(e.target.value))}
              className="w-full accent-[oklch(0.58_0.22_27)]"
            />
          </FilterGroup>
        </aside>

        {/* Results grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">Showing {filtered.length} of {products.length}</div>
            <select className="border rounded-md px-3 py-1.5 text-sm bg-card">
              <option>Relevance</option>
              <option>Price: low to high</option>
              <option>Lead time: fastest</option>
              <option>Top rated</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">
              No products match. Try clearing filters.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">{label}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FilterRow({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left text-sm px-2 py-1.5 rounded ${
        active ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
