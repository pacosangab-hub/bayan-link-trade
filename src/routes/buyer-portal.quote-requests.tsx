import { createFileRoute, Link } from "@tanstack/react-router";
import { rfqs } from "@/lib/mock-data";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/buyer-portal/quote-requests")({
  component: BuyerQuoteRequestsPage,
});

function BuyerQuoteRequestsPage() {
  const list = rfqs.slice(0, 12);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">My Quote Requests ({list.length})</h2>
        <Link to="/rfq/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-md text-sm font-semibold">
          <FileText size={14} /> Post Quote Request
        </Link>
      </div>
      {list.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-10 text-center text-sm text-muted-foreground">
          No quote requests yet.
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase text-muted-foreground border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-2.5">Request</th>
                <th className="text-left px-2">Category</th>
                <th className="text-left px-2">Qty</th>
                <th className="text-left px-2">Status</th>
                <th className="text-right px-2">Quotes</th>
                <th className="text-right px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium">{r.title}</td>
                  <td className="px-2 text-xs text-muted-foreground">{r.category}</td>
                  <td className="px-2 text-xs">{r.qty}</td>
                  <td className="px-2"><span className="chip chip-verified">{r.status}</span></td>
                  <td className="px-2 text-right font-semibold">{r.responses}</td>
                  <td className="px-4 text-right">
                    <Link to="/rfq/$id" params={{ id: r.id }} className="text-primary text-xs font-semibold">View →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
