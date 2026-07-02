import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAllRfqs } from "@/lib/rfq-store";
import { statusChipClass } from "@/components/ui-bits";
import { categories, regions, supplierById } from "@/lib/mock-data";
import { Plus, FileText, Inbox, Clock3, CheckCircle2, MapPin, Calendar, Package, Wallet, Users, ShieldCheck, ArrowRight, Sparkles, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import type { RFQ } from "@/lib/mock-data";
import SubmitQuoteModal from "@/components/rfq/SubmitQuoteModal";

export const Route = createFileRoute("/rfq/")({
  head: () => ({ meta: [{ title: "Get Supplier Quotes — PSG" }] }),
  component: RfqIndex,
});

function RfqIndex() {
  const all = useAllRfqs();
  const [tab, setTab] = useState<"buyer" | "supplier">("buyer");
  const [quoteFor, setQuoteFor] = useState<RFQ | null>(null);

  const openRequests = all.filter((r) => ["Open", "Receiving Quotes", "Awaiting Decision"].includes(r.status));
  const stats = useMemo(() => ({
    open: all.filter((r) => ["Open", "Receiving Quotes"].includes(r.status)).length,
    quotes: all.reduce((n, r) => n + (r.quotes?.length || 0), 0),
    awaiting: all.filter((r) => r.status === "Awaiting Decision").length,
    completed: all.filter((r) => ["Completed", "Order Created", "Supplier Selected"].includes(r.status)).length,
  }), [all]);

  return (
    <AppShell>
      {/* Hero */}
      <div className="gradient-hero text-white">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="text-xs uppercase tracking-[0.2em] text-white/80 font-semibold mb-2">RFQ Marketplace</div>
          <h1 className="font-display text-4xl md:text-5xl leading-tight">Get Supplier Quotes</h1>
          <p className="text-white/90 mt-3 max-w-2xl text-base md:text-lg">
            Post what your business needs. Verified suppliers will send prices, lead times, and delivery terms. Compare offers and choose the best one.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/rfq/new"
              className="bg-white text-primary px-6 py-3 rounded-md font-semibold inline-flex items-center gap-2 hover:bg-white/95"
            >
              <Plus size={18} /> Post a Quote Request
            </Link>
            <a href="#how" className="border-2 border-white/70 text-white px-6 py-3 rounded-md font-semibold inline-flex items-center gap-2 hover:bg-white/10">
              How it works
            </a>
          </div>
        </div>
      </div>

      {/* 3-step how-it-works */}
      <div id="how" className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 grid md:grid-cols-3 gap-4">
          <Step n={1} icon={<FileText size={20} />} title="Post what you need" body="Describe your product, quantity, and deadline in a 4-step form." />
          <Step n={2} icon={<Users size={20} />} title="Suppliers send quotes" body="Verified Philippine suppliers submit prices, MOQs, and lead times." />
          <Step n={3} icon={<CheckCircle2 size={20} />} title="Compare and choose" body="Pick the best offer. Pay through PSG Escrow. Track the order end to end." />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b sticky top-[97px] z-30 bg-background">
        <div className="mx-auto max-w-7xl px-4 flex gap-1">
          <TabBtn active={tab === "buyer"} onClick={() => setTab("buyer")} icon={<Inbox size={16} />}>Buyer Requests</TabBtn>
          <TabBtn active={tab === "supplier"} onClick={() => setTab("supplier")} icon={<Sparkles size={16} />}>Supplier Leads</TabBtn>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {tab === "buyer" ? (
          <BuyerRequests all={all} stats={stats} />
        ) : (
          <SupplierLeads leads={openRequests} onSubmit={(r) => setQuoteFor(r)} />
        )}
      </div>

      {quoteFor && (
        <SubmitQuoteModal rfq={quoteFor} onClose={() => setQuoteFor(null)} />
      )}
    </AppShell>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 text-sm font-semibold border-b-2 flex items-center gap-2 ${active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
    >
      {icon} {children}
    </button>
  );
}

function Step({ n, icon, title, body }: { n: number; icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="bg-card border rounded-lg p-5 flex gap-4">
      <div className="size-11 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">{icon}</div>
      <div>
        <div className="text-[11px] uppercase tracking-wider text-primary font-bold">Step {n}</div>
        <div className="font-semibold mt-0.5">{title}</div>
        <div className="text-sm text-muted-foreground mt-1">{body}</div>
      </div>
    </div>
  );
}

function BuyerRequests({ all, stats }: { all: RFQ[]; stats: { open: number; quotes: number; awaiting: number; completed: number } }) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI icon={<FileText size={18} />} label="Open Requests" value={stats.open} />
        <KPI icon={<Inbox size={18} />} label="Quotes Received" value={stats.quotes} />
        <KPI icon={<Clock3 size={18} />} label="Awaiting Decision" value={stats.awaiting} />
        <KPI icon={<CheckCircle2 size={18} />} label="Completed Orders" value={stats.completed} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-2xl">Your Quote Requests</h2>
        <Link to="/rfq/new" className="text-sm font-semibold text-primary inline-flex items-center gap-1">
          <Plus size={14} /> New request
        </Link>
      </div>

      <div className="space-y-3">
        {all.map((r) => <BuyerRfqCard key={r.id} r={r} />)}
      </div>
    </>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <span>{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <div className="font-display text-3xl mt-1">{value}</div>
    </div>
  );
}

function BuyerRfqCard({ r }: { r: RFQ }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {r.nextAction && (
        <div className="bg-gold/15 text-ink text-xs font-semibold px-4 py-2 flex items-center gap-2 border-b border-gold/30">
          <Sparkles size={13} className="text-primary" /> {r.nextAction}
        </div>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="chip chip-primary">{r.category}</span>
              <span className={`chip ${statusChipClass(r.status)}`}>{r.status}</span>
              <span className="text-xs text-muted-foreground">· {r.postedAgo}</span>
            </div>
            <h3 className="font-semibold text-lg leading-snug">{r.title}</h3>
            <div className="text-sm text-muted-foreground mt-0.5">{r.buyer} · {r.buyerType}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-display text-2xl text-primary leading-none">{r.responses}</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">Quotes</div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
          <Mini icon={<Package size={12} />} label="Quantity" value={r.qty} />
          <Mini icon={<Wallet size={12} />} label="Budget" value={r.budgetPhp} />
          <Mini icon={<MapPin size={12} />} label="Delivery" value={r.deliveryLocation ?? r.region} />
          <Mini icon={<Calendar size={12} />} label="Needed by" value={r.deliverBy} />
          <Mini icon={<Users size={12} />} label="Quotes received" value={String(r.responses)} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            to="/rfq/$id"
            params={{ id: r.id }}
            className="bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-md text-sm inline-flex items-center gap-2 hover:opacity-95"
          >
            View Quotes <ArrowRight size={14} />
          </Link>
          <button className="border rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-muted">Edit Request</button>
          <button className="border rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-muted text-muted-foreground">Close Request</button>
        </div>
      </div>
    </div>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/60 px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">{icon} {label}</div>
      <div className="text-sm font-medium truncate mt-0.5">{value}</div>
    </div>
  );
}

function SupplierLeads({ leads, onSubmit }: { leads: RFQ[]; onSubmit: (r: RFQ) => void }) {
  const [cat, setCat] = useState("All");
  const [region, setRegion] = useState("All");
  const [sort, setSort] = useState<"newest" | "most" | "fewest">("newest");

  let list = leads;
  if (cat !== "All") list = list.filter((r) => r.category === cat);
  if (region !== "All") list = list.filter((r) => r.region.includes(region));
  if (sort === "most") list = [...list].sort((a, b) => b.responses - a.responses);
  else if (sort === "fewest") list = [...list].sort((a, b) => a.responses - b.responses);

  return (
    <>
      <div className="mb-5">
        <h2 className="font-display text-2xl">Find Buyers Looking for Your Products</h2>
        <p className="text-muted-foreground text-sm mt-1">Browse open quote requests and submit your best offer.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5 items-center">
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="border rounded-md px-3 py-2 text-sm bg-background">
          <option>All</option>
          {categories.map((c) => <option key={c.name}>{c.name}</option>)}
        </select>
        <select value={region} onChange={(e) => setRegion(e.target.value)} className="border rounded-md px-3 py-2 text-sm bg-background">
          <option>All</option>
          {regions.map((r) => <option key={r}>{r}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as "newest" | "most" | "fewest")} className="border rounded-md px-3 py-2 text-sm bg-background">
          <option value="newest">Newest</option>
          <option value="most">Most quotes</option>
          <option value="fewest">Fewest quotes</option>
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{list.length} open leads</span>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {list.map((r) => <LeadCard key={r.id} r={r} onSubmit={() => onSubmit(r)} />)}
      </div>
    </>
  );
}

function LeadCard({ r, onSubmit }: { r: RFQ; onSubmit: () => void }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="chip chip-primary">{r.category}</span>
            {r.buyerVerified && <span className="chip chip-verified"><ShieldCheck size={12} /> Verified Buyer</span>}
          </div>
          <h3 className="font-semibold leading-snug">{r.title}</h3>
          <div className="text-xs text-muted-foreground mt-0.5">{r.buyer} · {r.buyerType}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-muted-foreground">{r.postedAgo}</div>
          <div className="text-xs font-medium mt-1">{r.responses} quotes</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <Mini icon={<Package size={12} />} label="Quantity" value={r.qty} />
        <Mini icon={<Wallet size={12} />} label="Budget" value={r.budgetPhp} />
        <Mini icon={<MapPin size={12} />} label="Delivery" value={r.deliveryLocation ?? r.region} />
        <Mini icon={<Calendar size={12} />} label="Deadline" value={r.deliverBy} />
      </div>
      <div className="mt-4 flex gap-2">
        <button
          onClick={onSubmit}
          className="flex-1 bg-primary text-primary-foreground font-semibold rounded-md py-2.5 text-sm hover:opacity-95"
        >
          Submit Quote
        </button>
        <Link to="/rfq/$id" params={{ id: r.id }} className="border rounded-md px-4 py-2.5 text-sm font-semibold hover:bg-muted">
          View Details
        </Link>
      </div>
    </div>
  );
}
