import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProductCard } from "@/components/ui-bits";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { useProducts } from "@/lib/db";
import { categories as INDUSTRY_LIST } from "@/lib/mock-data";
import { SlidersHorizontal, Loader2, X, ChevronDown } from "lucide-react";
import {
  CATEGORY_CHIPS, SUPPLIER_TYPE_CHIPS, REGION_CHIPS, TRUST_CHIPS,
  BUYING_CHIPS, DELIVERY_CHIPS,
  SORT_OPTIONS, matchFilters, sortResults, type SortOption,
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

const QUICK_ACTIONS = [
  "Verified only", "Escrow Ready", "Low MOQ", "Request Quote", "Fast Delivery", "Near NCR",
];

function ProductsPage() {
  const { data, isLoading } = useProducts();
  const [filters, setFilters] = useState<FilterState>(() => {
    if (typeof window === "undefined") return EMPTY;
    try { return { ...EMPTY, ...JSON.parse(localStorage.getItem(FS_KEY) || "{}") }; } catch { return EMPTY; }
  });
  const [sort, setSort] = useState<SortOption>("Best Match");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showAllIndustries, setShowAllIndustries] = useState(false);

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

  const industries = showAllIndustries ? INDUSTRY_LIST : INDUSTRY_LIST.slice(0, 6);

  return (
    <AppShell>
      {/* Header + search-first */}
      <div className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <h1 className="font-display text-3xl md:text-4xl">Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Find verified products, suppliers, and custom quotes across Philippine industries.
          </p>
          <div className="mt-6 max-w-3xl">
            <GlobalSearch />
          </div>

          {/* Quick actions */}
          <div className="mt-5 flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((f) => {
              const active = filters.quick.includes(f);
              return (
                <button key={f} onClick={() => toggle("quick", f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                    active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"
                  }`}>{f}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Browse by industry — compact */}
      <div className="mx-auto max-w-7xl px-4 pt-8">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold">Browse by industry</div>
          {INDUSTRY_LIST.length > 6 && (
            <button
              onClick={() => setShowAllIndustries((v) => !v)}
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              {showAllIndustries ? "Show less" : "View all industries"}
              <ChevronDown size={13} className={`transition ${showAllIndustries ? "rotate-180" : ""}`} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {industries.map((c: any) => {
            const active = filters.categories.includes(c.name);
            return (
              <button
                key={c.name}
                onClick={() => toggle("categories", c.name)}
                className={`text-left rounded-lg border p-3 transition min-w-0 ${
                  active ? "border-primary bg-primary/5" : "bg-card hover:border-primary/40"
                }`}
              >
                <div className="text-lg leading-none mb-1.5">{c.icon}</div>
                <div className="text-xs font-semibold leading-tight truncate">{c.name}</div>
                {c.examples && (
                  <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.examples}</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="mx-auto max-w-7xl px-4 py-8 grid lg:grid-cols-[260px_1fr] gap-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-4">
            <FilterPanel filters={filters} toggle={toggle} onClear={clearAll} />
          </div>
        </aside>

        <div className="min-w-0 space-y-4">
          {/* Active filters */}
          {activeCount > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mr-1">Active</span>
              {(Object.keys(filters) as (keyof FilterState)[]).flatMap((g) =>
                filters[g].map((v) => (
                  <button key={`${g}-${v}`} onClick={() => toggle(g, v)} className="chip chip-primary text-xs inline-flex items-center gap-1">
                    {v} <X size={11} />
                  </button>
                )),
              )}
              <button onClick={clearAll} className="ml-auto text-xs font-semibold text-destructive hover:underline">Clear all</button>
            </div>
          )}

          {/* Results header */}
          <div className="flex flex-wrap items-center gap-3 border-b pb-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">
                {isLoading ? "Loading…" : `${sorted.length} product${sorted.length === 1 ? "" : "s"} found`}
              </div>
              <div className="text-xs text-muted-foreground">
                Showing verified and escrow-ready suppliers first.
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden inline-flex items-center gap-1.5 border rounded-md px-3 py-1.5 text-xs font-semibold bg-card"
              >
                <SlidersHorizontal size={13} /> Filters
                {activeCount > 0 && <span className="chip chip-primary text-[10px]">{activeCount}</span>}
              </button>
              <label className="text-xs text-muted-foreground hidden sm:block">Sort</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="text-xs border rounded-md bg-card px-2 py-1.5"
              >
                {SORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" /> Loading products…
            </div>
          ) : sorted.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed p-10 text-center space-y-3">
              <div className="font-semibold text-lg">No exact matches found</div>
              <div className="text-sm text-muted-foreground max-w-md mx-auto">
                Try removing a filter or post a quote request so suppliers can respond.
              </div>
              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <button onClick={clearAll} className="px-3 py-2 rounded-md border bg-card text-xs font-semibold">Clear filters</button>
                <Link to="/rfq/new" className="px-3 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold">Post RFQ</Link>
                <Link to="/products" className="px-3 py-2 rounded-md border bg-card text-xs font-semibold">Browse categories</Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-semibold">Refine Results</div>
        <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">Reset</button>
      </div>
      <div className="text-xs text-muted-foreground mb-3">Click to narrow results.</div>

      <FilterAccordion label="Category" defaultOpen options={CATEGORY_CHIPS} selected={filters.categories} onToggle={(v) => toggle("categories", v)} />
      <FilterAccordion label="Supplier Type" options={SUPPLIER_TYPE_CHIPS} selected={filters.supplierTypes} onToggle={(v) => toggle("supplierTypes", v)} />
      <FilterAccordion label="Location" options={REGION_CHIPS} selected={filters.regions} onToggle={(v) => toggle("regions", v)} />
      <FilterAccordion label="Trust Level" options={TRUST_CHIPS} selected={filters.trust} onToggle={(v) => toggle("trust", v)} />
      <FilterAccordion label="Buying Type" options={BUYING_CHIPS} selected={filters.buying} onToggle={(v) => toggle("buying", v)} />
      <FilterAccordion label="Delivery Speed" options={DELIVERY_CHIPS} selected={filters.delivery} onToggle={(v) => toggle("delivery", v)} />
    </div>
  );
}

function FilterAccordion({
  label, options, selected, onToggle, defaultOpen = false,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? options : options.slice(0, 6);
  const activeCount = options.filter((o) => selected.includes(o)).length;

  return (
    <div className="border-t first:border-t-0 py-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between text-left"
      >
        <span className="text-xs uppercase tracking-wider font-semibold">
          {label}
          {activeCount > 0 && <span className="ml-1.5 text-primary normal-case tracking-normal">({activeCount})</span>}
        </span>
        <ChevronDown size={14} className={`text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {visible.map((o) => {
            const active = selected.includes(o);
            return (
              <button key={o} onClick={() => onToggle(o)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                  active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"
                }`}>{o}</button>
            );
          })}
          {options.length > 6 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold text-primary hover:underline"
            >
              {expanded ? "Show less" : `Show more (${options.length - 6})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
