import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAllOffers, offerStatusChip, formatPhp, supplierById } from "@/lib/offers-store";
import { useState } from "react";
import { ArrowRight, ShieldCheck, Package, Calendar, Wallet } from "lucide-react";

export const Route = createFileRoute("/offers/")({
  head: () => ({ meta: [{ title: "Custom Offers — PSG Buyer" }] }),
  component: OffersIndex,
});

const TABS = ["To review", "Accepted", "Changes requested", "All"] as const;

function OffersIndex() {
  const offers = useAllOffers();
  const [tab, setTab] = useState<(typeof TABS)[number]>("To review");

  const filtered = offers.filter((o) => {
    if (tab === "To review") return o.status === "Pending Review";
    if (tab === "Accepted") return o.status === "Accepted" || o.status === "Converted to Order";
    if (tab === "Changes requested") return o.status === "Changes Requested";
    return true;
  });

  return (
    <AppShell>
      <div className="gradient-hero text-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="text-[10px] uppercase tracking-widest font-bold text-white/85">Buyer inbox</div>
          <h1 className="font-display text-4xl mt-1">Custom Offers</h1>
          <p className="text-white/90 mt-2 max-w-2xl">
            Supplier proposals sent in response to your custom requests. Review, accept, negotiate, or reject —
            accepted offers become escrow-protected orders instantly.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="border-b flex gap-1 overflow-x-auto text-sm mb-5">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 whitespace-nowrap font-medium border-b-2 ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">
            Nothing in this tab yet.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((o) => {
            const s = supplierById(o.supplierId);
            return (
              <div key={o.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Offer v{o.version} · {o.category}</div>
                  <span className={`chip ${offerStatusChip(o.status)}`}>{o.status}</span>
                </div>
                <div className="font-semibold leading-tight">{o.title}</div>
                <div className="text-xs text-muted-foreground mt-1">From <strong>{s.name}</strong> · valid {o.validUntil}</div>
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <Stat icon={<Package size={12} />} label="Qty" value={`${o.qty} ${o.unit}`} />
                  <Stat icon={<Calendar size={12} />} label="Lead" value={`${o.leadTimeDays}d`} />
                  <Stat icon={<Wallet size={12} />} label="Total" value={formatPhp(o.breakdown.total)} />
                </div>
                {o.escrowAvailable && (
                  <div className="mt-2 text-[11px] text-success flex items-center gap-1">
                    <ShieldCheck size={12} /> Escrow-protected
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <Link to="/offers/$id" params={{ id: o.id }}
                    className="flex-1 bg-primary text-primary-foreground text-sm font-semibold rounded-md py-2 text-center hover:bg-primary/90 inline-flex items-center justify-center gap-1.5">
                    {o.status === "Converted to Order" ? "Track Order" : o.status === "Accepted" ? "Pay via Escrow" : "Review Offer"}
                    <ArrowRight size={14} />
                  </Link>
                  <Link to="/messages" className="border rounded-md px-3 py-2 text-sm hover:bg-muted">Message</Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/60 px-2 py-1.5">
      <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">{icon} {label}</div>
      <div className="font-semibold truncate">{value}</div>
    </div>
  );
}
