import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RFQCard } from "@/components/ui-bits";
import { useRfqs } from "@/lib/db";
import { useSession } from "@/lib/auth";
import { Plus, Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/rfq/")({
  head: () => ({ meta: [{ title: "RFQ Center — PSG" }] }),
  component: RfqPage,
});

function RfqPage() {
  const { data: rfqs = [], isLoading } = useRfqs();
  const { user } = useSession();

  return (
    <AppShell>
      <div className="gradient-hero text-white">
        <div className="mx-auto max-w-7xl px-4 py-14">
          <div className="text-[10px] uppercase tracking-widest font-bold text-white/85">RFQ Center</div>
          <h1 className="font-display text-4xl md:text-5xl mt-1 max-w-3xl">Need supplies for your business? Get 3 verified quotes in minutes.</h1>
          <p className="text-white/90 mt-3 max-w-2xl">
            Skip the phone tag. Post what you need, we route it to matching verified Philippine suppliers, and you compare offers side-by-side.
          </p>
          <div className="mt-6 grid sm:grid-cols-3 gap-3 max-w-3xl">
            {[
              { n: "1", t: "Post your request", d: "Tell us what, how much, when." },
              { n: "2", t: "Compare quotes", d: "Price, delivery, terms — side by side." },
              { n: "3", t: "Order with escrow", d: "Pay safely. Funds released on delivery." },
            ].map((s) => (
              <div key={s.n} className="rounded-lg bg-white/10 border border-white/20 p-4 backdrop-blur">
                <div className="size-8 rounded-full bg-white text-primary grid place-items-center font-display font-bold text-sm">{s.n}</div>
                <div className="font-semibold text-white mt-2">{s.t}</div>
                <div className="text-xs text-white/80 mt-0.5">{s.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-2 flex-wrap">
            {user ? (
              <Link to="/rfq/new" className="inline-flex items-center gap-2 bg-white text-primary font-semibold rounded-md px-5 py-3 text-sm">
                <Plus size={16} /> Get supplier quotes
              </Link>
            ) : (
              <Link to="/auth" className="inline-flex items-center gap-2 bg-white text-primary font-semibold rounded-md px-5 py-3 text-sm">
                <Sparkles size={16} /> Sign in to post a request
              </Link>
            )}
            <Link to="/buyer-portal" className="inline-flex items-center gap-2 border border-white/40 text-white font-semibold rounded-md px-5 py-3 text-sm hover:bg-white/10">
              Buyer dashboard
            </Link>
          </div>
        </div>
      </div>


      <div className="mx-auto max-w-7xl px-4 py-6">
        <h2 className="font-display text-2xl mb-4">Open RFQs from Philippine buyers</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="animate-spin mr-2" /> Loading RFQs…
          </div>
        ) : rfqs.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed p-12 text-center text-muted-foreground">
            No open RFQs yet. Be the first to post one!
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {rfqs.map((r: any) => <RFQCard key={r.id} r={r} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
