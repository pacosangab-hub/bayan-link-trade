import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { SupplierCard } from "@/components/ui-bits";
import { useSuppliers } from "@/lib/db";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/suppliers")({
  head: () => ({ meta: [{ title: "Suppliers — PSG" }] }),
  component: SuppliersLayout,
});

function SuppliersLayout() {
  const matches = useMatches();
  const isChild = matches.some((m) => m.routeId.includes("/suppliers/$id"));
  if (isChild) return <Outlet />;
  return <SuppliersPage />;
}

function SuppliersPage() {
  const { data: suppliers = [], isLoading } = useSuppliers();
  const [type, setType] = useState<string | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const types = Array.from(new Set(suppliers.map((s) => s.type)));
  const filtered = suppliers.filter((s) => {
    if (type && s.type !== type) return false;
    if (verifiedOnly && !s.verified) return false;
    return true;
  });

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <h1 className="font-display text-3xl">Verified Suppliers</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${filtered.length} suppliers · KYC verified · escrow ready`}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Pill active={type === null} onClick={() => setType(null)}>All types</Pill>
          {types.map((t) => (
            <Pill key={t} active={type === t} onClick={() => setType(t)}>{t}</Pill>
          ))}
          <label className="ml-auto flex items-center gap-2 text-sm">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
            Verified only
          </label>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" /> Loading suppliers…
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s) => <SupplierCard key={s.id} s={s} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Pill({ active, onClick, children }: any) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"
      }`}>
      {children}
    </button>
  );
}
