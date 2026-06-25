import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { SupplierCard } from "@/components/ui-bits";
import { suppliers, regions, supplierTypes, categories } from "@/lib/mock-data";
import { useState } from "react";

export const Route = createFileRoute("/suppliers")({
  head: () => ({ meta: [{ title: "Suppliers — PSG" }] }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const [type, setType] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filtered = suppliers.filter((s) => {
    if (type && s.type !== type) return false;
    if (region && s.region !== region) return false;
    if (cat && !s.categories.includes(cat)) return false;
    if (verifiedOnly && !s.verified) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="font-display text-3xl">Verified Suppliers</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} suppliers · KYC verified · escrow ready</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Pill active={type === null} onClick={() => setType(null)}>All types</Pill>
          {supplierTypes.map((t) => (
            <Pill key={t} active={type === t} onClick={() => setType(t)}>{t}</Pill>
          ))}
          <span className="mx-2 h-6 w-px bg-border" />
          <Pill active={region === null} onClick={() => setRegion(null)}>All regions</Pill>
          {regions.map((r) => (
            <Pill key={r} active={region === r} onClick={() => setRegion(r)}>{r}</Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Category:</span>
          <Pill active={cat === null} onClick={() => setCat(null)}>Any</Pill>
          {categories.slice(0, 8).map((c) => (
            <Pill key={c.name} active={cat === c.name} onClick={() => setCat(c.name)}>{c.icon} {c.name}</Pill>
          ))}
          <label className="ml-auto flex items-center gap-2 text-sm">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
            Verified only
          </label>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => <SupplierCard key={s.id} s={s} />)}
        </div>
      </div>
    </AppShell>
  );
}

function Pill({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}
