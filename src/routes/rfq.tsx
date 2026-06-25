import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RFQCard, SectionHeader } from "@/components/ui-bits";
import { rfqs, categories } from "@/lib/mock-data";
import { Plus } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/rfq")({
  head: () => ({ meta: [{ title: "RFQ Marketplace — PSG" }] }),
  component: RFQList,
});

function RFQList() {
  const [tab, setTab] = useState<"open" | "all" | "mine">("open");
  const filtered = rfqs.filter((r) => (tab === "open" ? r.status === "Open" : true));

  return (
    <AppShell>
      <div className="bg-ink text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 grid md:grid-cols-[1fr_auto] gap-6 items-end">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-[oklch(0.78_0.15_75)] font-semibold mb-2">RFQ Marketplace</div>
            <h1 className="font-display text-4xl md:text-5xl">Request for Quotation</h1>
            <p className="text-white/80 mt-2 max-w-xl">
              Buyers post what they need. Verified suppliers send quotes. You pick the best price, lead time, and rating.
            </p>
          </div>
          <Link
            to="/rfq/new"
            className="bg-primary px-5 py-3 rounded-md font-semibold inline-flex items-center gap-2"
          >
            <Plus size={18} /> Post a new RFQ
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[220px_1fr] gap-6">
        <aside>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Status</div>
          <div className="space-y-1">
            {(["open", "all", "mine"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`w-full text-left text-sm px-3 py-2 rounded ${tab === t ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"}`}
              >
                {t === "open" ? "Open RFQs" : t === "all" ? "All RFQs" : "My RFQs"}
              </button>
            ))}
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mt-5 mb-2">Categories</div>
          <div className="space-y-1">
            {categories.slice(0, 8).map((c) => (
              <button key={c.name} className="w-full text-left text-sm px-3 py-1.5 hover:bg-muted rounded">
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </aside>

        <div>
          <SectionHeader title={`${filtered.length} ${tab === "open" ? "open" : ""} requests`} />
          <div className="space-y-3">
            {filtered.map((r) => <RFQCard key={r.id} r={r} />)}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
