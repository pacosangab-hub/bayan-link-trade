import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/ui-bits";
import { useProducts, useCategories } from "@/lib/db";
import { SlidersHorizontal, Loader2 } from "lucide-react";

export const Route = createFileRoute("/products/")({
  head: () => ({ meta: [{ title: "Products — PSG Marketplace" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const { data, isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const [cat, setCat] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const regions = useMemo(() => {
    const set = new Set<string>();
    (data || []).forEach((r) => r.product.origin && set.add(r.product.origin.split(",").pop()!.trim()));
    return Array.from(set).slice(0, 8);
  }, [data]);

  const filtered = (data || []).filter(({ product, supplier }) => {
    if (cat && product.category !== cat) return false;
    if (region && !product.origin.includes(region)) return false;
    if (verifiedOnly && supplier?.verification_status !== "verified") return false;
    return true;
  });

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="font-display text-3xl">Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${filtered.length} products · seller-fulfilled · escrow-protected`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[260px_1fr] gap-6">
        <aside className="space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal size={16} /> Filters
          </div>
          <FilterGroup label="Category">
            <FilterRow active={cat === null} onClick={() => setCat(null)}>All</FilterRow>
            {categories.map((c: any) => (
              <FilterRow key={c.id} active={cat === c.name} onClick={() => setCat(c.name)}>
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
          <FilterGroup label="Trust">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
              Verified suppliers only
            </label>
          </FilterGroup>
        </aside>

        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" /> Loading products…
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-4">Showing {filtered.length} of {(data || []).length}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(({ product }) => <ProductCard key={product.id} p={product} />)}
              </div>
              {filtered.length === 0 && (
                <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">
                  No products match. Try clearing filters.
                </div>
              )}
            </>
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
    <button onClick={onClick}
      className={`w-full text-left text-sm px-2 py-1.5 rounded ${active ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"}`}>
      {children}
    </button>
  );
}
