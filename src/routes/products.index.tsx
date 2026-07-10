import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/ui-bits";
import { useProducts } from "@/lib/db";
import { categories as INDUSTRY_LIST } from "@/lib/mock-data";
import { SlidersHorizontal, Loader2, X, Bookmark, ChevronDown, ChevronUp } from "lucide-react";
import {
  CATEGORY_CHIPS, SUPPLIER_TYPE_CHIPS, REGION_CHIPS, TRUST_CHIPS,
  BUYING_CHIPS, DELIVERY_CHIPS, ORDER_SIZE_CHIPS, COMPLIANCE_CHIPS,
  QUICK_FILTERS, SORT_OPTIONS, matchFilters, sortResults, type SortOption,
} from "@/lib/search";

export const Route = createFileRoute("/products/")({
  head: () => ({ meta: [{ title: "Marketplace — PSG Supply Gateway" }] }),
  component: ProductsPage,
});

type FilterState = {
  categories: string[];
  supplierTypes: string[];
  regions: string[];
  trust: string[];
  buying: string[];
  delivery: string[];
  orderSize: string[];
  compliance: string[];
  quick: string[];
};

const EMPTY: FilterState = {
  categories: [], supplierTypes: [], regions: [], trust: [],
  buying: [], delivery: [], orderSize: [], compliance: [], quick: [],
};

const FS_KEY = "psg_filters_v1";

function ProductsPage() {
  const { data, isLoading } = useProducts();
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window === "undefined") return EMPTY;
    try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(FS_KEY) || "{}") }; } catch { return EMPTY; }
  });
  const [sort, setSort] = useState<SortOption>("Best Match");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(FS_KEY, JSON.stringify(filters));
  }, [filters]);

  const toggle = (group: keyof FilterState, v: string) =>
    setFilters((f) => ({ ...f, [group]: f[group].includes(v) ? f[group].filter((x) => x !== v) : [...f[group], v] }));

  const clearAll = () => setFilters(EMPTY);
  const activeCount = Object.values(filters).reduce((n, arr) => n + arr.length, 0);

  const filtered = useMemo(
    () => (data ?? []).filter((r) => matchFilters(r as any, filters)),
    [data, filters],
  );
  const sorted = useMemo(() => sortResults(filtered as any, sort), [filtered, sort]);

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="font-display text-3xl">Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${sorted.length} of ${(data || []).length} products · escrow-protected`}
          </p>
        </div>
      </div>

      {/* Category discovery */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="text-sm font-semibold mb-3">Browse by Industry</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {INDUSTRY_LIST.slice(0, 10).map((c: any) => {
            const active = filters.categories.includes(c.name);
            return (
              <button
                key={c.name}
                onClick={() => toggle("categories", c.name)}
                className={`text-left rounded-lg border p-3 transition ${active ? "border-primary bg-primary/5" : "bg-card hover:border-primary/40"}`}
              >
                <div className="text-xl leading-none mb-1">{c.icon}</div>
                <div className="text-xs font-semibold leading-tight">{c.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick filter bar */}
      <div className="mx-auto max-w-7xl px-4 pt-6">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mr-1">Quick filters</span>
          {QUICK_FILTERS.map((f) => {
            const active = filters.quick.includes(f);
            return (
              <button key={f} onClick={() => toggle("quick", f)}
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
            <button onClick={() => setMobileOpen(true)} className="lg:hidden inline-flex items-center gap-1.5 border rounded-md px-3 py-1.5 text-xs font-semibold bg-card">
              <SlidersHorizontal size={13} /> Filters {activeCount > 0 && <span className="chip chip-primary text-[10px]">{activeCount}</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Active filters */}
      {activeCount > 0 && (
        <div className="mx-auto max-w-7xl px-4 pt-4">
          <div className="rounded-lg border bg-card p-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Active filters</span>
            {(Object.keys(filters) as (keyof FilterState)[]).flatMap((g) =>
              filters[g].map((v) => (
                <button key={`${g}-${v}`} onClick={() => toggle(g, v)} className="chip chip-primary text-xs inline-flex items-center gap-1">
                  {v} <X size={11} />
                </button>
              )),
            )}
            <button onClick={clearAll} className="ml-auto text-xs font-semibold text-destructive hover:underline">Clear all filters</button>
            <button className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
              <Bookmark size={12} /> Save this search
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block space-y-5">
          <FilterPanel filters={filters} toggle={toggle} onClear={clearAll} />
        </aside>

        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" /> Loading products…
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed p-8 text-center space-y-3">
              <div className="font-semibold">No exact matches.</div>
              <div className="text-sm text-muted-foreground">Try removing a filter, browsing a related category, or posting an RFQ.</div>
              <div className="flex flex-wrap gap-2 justify-center">
                <button onClick={clearAll} className="px-3 py-1.5 rounded-md border bg-card text-xs font-semibold">Remove all filters</button>
                <Link to="/rfq/new" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold">Post an RFQ</Link>
                <Link to="/custom-requests" className="px-3 py-1.5 rounded-md border bg-card text-xs font-semibold">Request custom quote</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {sorted.map(({ product }: any) => <ProductCard key={product.id} p={product} />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom-sheet filters */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 bg-background rounded-t-xl max-h-[85vh] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">Refine Results</div>
              <button onClick={() => setMobileOpen(false)}><X size={18} /></button>
            </div>
            <FilterPanel filters={filters} toggle={toggle} onClear={clearAll} />
            <div className="sticky bottom-0 bg-background pt-3 mt-3 flex gap-2 border-t">
              <button onClick={clearAll} className="flex-1 py-2 rounded-md border text-sm font-semibold">Clear all</button>
              <button onClick={() => setMobileOpen(false)} className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold">Apply filters</button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function FilterPanel({
  filters, toggle, onClear,
}: {
  filters: FilterState;
  toggle: (g: keyof FilterState, v: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal size={16} /> Refine Results
        </div>
        <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">Reset</button>
      </div>
      <div className="text-xs text-muted-foreground">Click to narrow results.</div>

      <ChipGroup label="What do you need?" options={CATEGORY_CHIPS} selected={filters.categories} onToggle={(v) => toggle("categories", v)} />
      <ChipGroup label="Supplier type" options={SUPPLIER_TYPE_CHIPS} selected={filters.supplierTypes} onToggle={(v) => toggle("supplierTypes", v)} />
      <ChipGroup label="Location" options={REGION_CHIPS} selected={filters.regions} onToggle={(v) => toggle("regions", v)} />
      <ChipGroup label="Trust level" options={TRUST_CHIPS} selected={filters.trust} onToggle={(v) => toggle("trust", v)} />
      <ChipGroup label="Buying type" options={BUYING_CHIPS} selected={filters.buying} onToggle={(v) => toggle("buying", v)} />
      <ChipGroup label="Delivery speed" options={DELIVERY_CHIPS} selected={filters.delivery} onToggle={(v) => toggle("delivery", v)} />
      <ChipGroup label="Order size" options={ORDER_SIZE_CHIPS} selected={filters.orderSize} onToggle={(v) => toggle("orderSize", v)} />
      <ChipGroup label="Compliance" options={COMPLIANCE_CHIPS} selected={filters.compliance} onToggle={(v) => toggle("compliance", v)} collapsible />
    </div>
  );
}

function ChipGroup({
  label, options, selected, onToggle, collapsible,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  return (
    <div>
      <button
        type="button"
        onClick={() => collapsible && setOpen((v) => !v)}
        className="w-full flex items-center justify-between mb-2"
      >
        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">{label}</span>
        {collapsible && (open ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
      </button>
      {open && (
        <div className="flex flex-wrap gap-1.5">
          {options.map((o) => {
            const active = selected.includes(o);
            return (
              <button key={o} onClick={() => onToggle(o)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                  active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"
                }`}>{o}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}
