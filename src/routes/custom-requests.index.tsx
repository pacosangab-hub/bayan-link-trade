import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAllRequests, requestStatusChip, formatPhp, supplierById } from "@/lib/offers-store";
import { useState } from "react";
import { MapPin, Calendar, Package, Wallet, MessageSquare, Inbox } from "lucide-react";

export const Route = createFileRoute("/custom-requests/")({
  head: () => ({ meta: [{ title: "Custom Requests — PSG Supplier" }] }),
  component: CustomRequestsIndex,
});

const TABS = ["Needs my offer", "Waiting on buyer", "Converted", "All"] as const;

function CustomRequestsIndex() {
  const reqs = useAllRequests();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Needs my offer");

  const filtered = reqs.filter((r) => {
    if (tab === "Needs my offer") return r.status === "New Request" || r.status === "Waiting for Supplier Offer" || r.status === "Buyer Requested Changes";
    if (tab === "Waiting on buyer") return r.status === "Custom Offer Sent";
    if (tab === "Converted") return r.status === "Converted to Order" || r.status === "Accepted";
    return true;
  });

  return (
    <AppShell>
      <div className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="text-[10px] uppercase tracking-widest text-gold font-bold">Supplier inbox</div>
          <h1 className="font-display text-4xl mt-1">Custom Requests</h1>
          <p className="text-white/80 mt-2 max-w-2xl">
            Buyers asking for custom pricing, MOQ, packaging, private label, or recurring supply.
            Reply with a professional <strong className="text-white">Custom Offer</strong> — it becomes an escrow-protected order when accepted.
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
            <Inbox className="mx-auto mb-2" /> No requests in this tab.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((r) => {
            const s = supplierById(r.supplierId);
            return (
              <div key={r.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="chip chip-primary">{r.category}</span>
                      <span className={`chip ${requestStatusChip(r.status)}`}>{r.status}</span>
                      <span className="text-xs text-muted-foreground">{r.createdAt}</span>
                    </div>
                    <h3 className="font-semibold leading-tight">{r.productName}</h3>
                    <div className="text-xs text-muted-foreground mt-0.5">{r.buyerBusiness} · {r.buyerType}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mt-3">
                  <Stat icon={<Package size={12} />} label="Qty" value={`${r.qty} ${r.unit}`} />
                  <Stat icon={<Wallet size={12} />} label="Budget" value={formatPhp(r.budgetPhp)} />
                  <Stat icon={<MapPin size={12} />} label="Deliver" value={r.deliveryLocation} />
                  <Stat icon={<Calendar size={12} />} label="Needed" value={r.neededBy} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Link to="/custom-requests/$id" params={{ id: r.id }}
                    className="flex-1 bg-primary text-primary-foreground text-sm font-semibold rounded-md py-2 text-center hover:bg-primary/90">
                    {r.offerIds.length > 0 && r.status === "Buyer Requested Changes" ? "Revise Offer" : "Send Custom Offer"}
                  </Link>
                  <Link to="/messages" className="border rounded-md px-3 py-2 text-sm inline-flex items-center gap-1.5 hover:bg-muted">
                    <MessageSquare size={14} /> Message
                  </Link>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground truncate">Selling to {s.name}'s buyer — respond fast to win the order.</div>
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
    <div className="rounded-md bg-muted/60 px-2.5 py-1.5">
      <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">{icon} {label}</div>
      <div className="font-medium truncate">{value}</div>
    </div>
  );
}
