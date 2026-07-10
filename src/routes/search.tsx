import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard, SupplierCard } from "@/components/ui-bits";
import { fullSearch, sortResults, SORT_OPTIONS, type SortOption, matchFilters, QUICK_FILTERS } from "@/lib/search";
import { ArrowRight, MessageSquare, Package, Store, Tag, Sparkles } from "lucide-react";

export const Route = createFileRoute("/search")({
  head: ({ params }) => ({
    meta: [{ title: `Search — PSG Supply Gateway` }],
  }),
  validateSearch: (raw: Record<string, unknown>) => ({
    q: typeof raw.q === "string" ? raw.q : "",
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const [quick, setQuick] = useState<string[]>([]);
  const [sort, setSort] = useState<SortOption>("Best Match");

  const results = useMemo(() => fullSearch(q), [q]);

  const filteredProducts = useMemo(
    () => results.products.filter((r) => matchFilters(r, { quick })),
    [results, quick],
  );
  const sortedProducts = useMemo(() => sortResults(filteredProducts, sort, q), [filteredProducts, sort, q]);

  const toggle = (v: string) => setQuick((arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]));

  const totalHits = sortedProducts.length + results.suppliers.length + results.categories.length;

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Search results</div>
          <h1 className="font-display text-3xl">
            Search results for “{q}”
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalHits} result{totalHits === 1 ? "" : "s"} · {sortedProducts.length} product{sortedProducts.length === 1 ? "" : "s"} · {results.suppliers.length} supplier{results.suppliers.length === 1 ? "" : "s"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/rfq/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-semibold">
              <MessageSquare size={14} /> Post RFQ for “{q}”
            </Link>
            {results.categories[0] && (
              <Link to="/search" search={{ q: results.categories[0] }} className="inline-flex items-center gap-2 border bg-card px-3 py-2 rounded-md text-sm font-semibold">
                <Tag size={14} /> Browse {results.categories[0]}
              </Link>
            )}
            <Link to="/suppliers" className="inline-flex items-center gap-2 border bg-card px-3 py-2 rounded-md text-sm font-semibold">
              <Store size={14} /> View verified suppliers
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-8">
        {/* Quick filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mr-1">Quick filters</span>
          {QUICK_FILTERS.map((f) => {
            const active = quick.includes(f);
            return (
              <button key={f} onClick={() => toggle(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                  active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"
                }`}>{f}</button>
            );
          })}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Sort</label>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="text-xs border rounded-md bg-card px-2 py-1.5">
              {SORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {results.categories.length > 0 && (
          <section>
            <SectionTitle icon={<Tag size={14} />} label={`Category matches (${results.categories.length})`} />
            <div className="flex flex-wrap gap-2">
              {results.categories.map((c) => (
                <Link key={c} to="/search" search={{ q: c }} className="chip chip-primary text-xs">
                  {c} <ArrowRight size={12} />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionTitle icon={<Package size={14} />} label={`Products (${sortedProducts.length})`} />
          {sortedProducts.length === 0 ? (
            <EmptyState q={q} onClearQuick={() => setQuick([])} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sortedProducts.slice(0, 24).map(({ product }) => <ProductCard key={product.id} p={product} />)}
            </div>
          )}
        </section>

        {results.suppliers.length > 0 && (
          <section>
            <SectionTitle icon={<Store size={14} />} label={`Suppliers (${results.suppliers.length})`} />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.suppliers.slice(0, 6).map((s) => <SupplierCard key={s.id} s={s} />)}
            </div>
          </section>
        )}

        {results.related.length > 0 && (
          <section>
            <SectionTitle icon={<Sparkles size={14} />} label="Related searches" />
            <div className="flex flex-wrap gap-2">
              {results.related.map((r) => (
                <Link key={r} to="/search" search={{ q: r }} className="px-3 py-1.5 rounded-full text-xs border bg-card hover:bg-muted">
                  {r}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="text-sm font-semibold mb-3 inline-flex items-center gap-2">
      <span className="text-primary">{icon}</span> {label}
    </div>
  );
}

function EmptyState({ q, onClearQuick }: { q: string; onClearQuick: () => void }) {
  return (
    <div className="rounded-lg border-2 border-dashed p-8 text-center space-y-3">
      <div className="font-semibold">No exact matches for “{q}”.</div>
      <div className="text-sm text-muted-foreground">Try one of these instead:</div>
      <div className="flex flex-wrap gap-2 justify-center">
        <button onClick={onClearQuick} className="px-3 py-1.5 rounded-md border bg-card text-xs font-semibold">Remove quick filters</button>
        <Link to="/products" className="px-3 py-1.5 rounded-md border bg-card text-xs font-semibold">Browse related categories</Link>
        <Link to="/rfq/new" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold">Post an RFQ</Link>
      </div>
    </div>
  );
}
