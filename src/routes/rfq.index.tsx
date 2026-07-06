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
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="text-[10px] uppercase tracking-widest font-bold text-white/85">RFQ Marketplace</div>
          <h1 className="font-display text-4xl mt-1">Get Supplier Quotes</h1>
          <p className="text-white/90 mt-2 max-w-2xl">
            Post what you need. Verified suppliers respond with pricing, lead times, and terms.
          </p>
          <div className="mt-5 flex gap-2">
            {user ? (
              <Link to="/rfq/new" className="inline-flex items-center gap-2 bg-white text-primary font-semibold rounded-md px-4 py-2.5 text-sm">
                <Plus size={16} /> Post an RFQ
              </Link>
            ) : (
              <Link to="/auth" className="inline-flex items-center gap-2 bg-white text-primary font-semibold rounded-md px-4 py-2.5 text-sm">
                <Sparkles size={16} /> Sign in to post an RFQ
              </Link>
            )}
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
