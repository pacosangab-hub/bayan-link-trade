import { createFileRoute, Link } from "@tanstack/react-router";
import { rfqs } from "@/lib/mock-data";
import { MessageSquare, Send } from "lucide-react";

export const Route = createFileRoute("/supplier-portal/quote-requests")({
  component: QuoteRequestsPage,
});

function QuoteRequestsPage() {
  const items = rfqs.slice(0, 8);
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Quote Requests ({items.length})</h2>
      <div className="grid gap-3">
        {items.map((r) => (
          <div key={r.id} className="rounded-lg border bg-card p-4 flex flex-wrap items-start gap-4">
            <div className="flex-1 min-w-[260px]">
              <div className="text-xs text-muted-foreground">{r.buyer} · {r.buyerType}</div>
              <div className="font-medium mt-0.5">{r.title}</div>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <Info label="Quantity" value={r.qty} />
                <Info label="Budget" value={r.budgetPhp} />
                <Info label="Delivery" value={r.deliveryLocation || r.region} />
                <Info label="Needed by" value={r.deliverBy} />
              </div>
            </div>
            <div className="flex flex-col gap-2 ml-auto">
              <Link to="/rfq/$id" params={{ id: r.id }} className="inline-flex items-center justify-center gap-1 text-xs px-3 py-2 rounded bg-primary text-primary-foreground font-semibold">
                <Send size={12} /> Send Offer
              </Link>
              <Link to="/messages" className="inline-flex items-center justify-center gap-1 text-xs px-3 py-2 rounded border font-semibold">
                <MessageSquare size={12} /> Message Buyer
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-muted/60 px-2 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium truncate">{value}</div>
    </div>
  );
}
