import { createFileRoute, Link } from "@tanstack/react-router";
import { getAllRfqs } from "@/lib/rfq-store";
import { rfqs as MOCK } from "@/lib/mock-data";

export const Route = createFileRoute("/buyer-portal/quote-requests")({
  component: BuyerRequests,
});

function BuyerRequests() {
  let list: any[] = [];
  try { list = getAllRfqs(); } catch { list = MOCK; }
  if (!list.length) list = MOCK;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">My Quote Requests ({list.length})</h2>
        <Link to="/rfq/new" className="text-sm bg-primary text-primary-foreground px-3 py-2 rounded font-semibold">Post Quote Request</Link>
      </div>
      <div className="rounded-lg border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/40">
            <tr>
              <th className="text-left px-4 py-2.5">Title</th>
              <th className="text-left px-2">Category</th>
              <th className="text-left px-2">Quantity</th>
              <th className="text-left px-2">Region</th>
              <th className="text-left px-2">Status</th>
              <th className="text-right px-2">Quotes</th>
              <th className="text-right px-4"></th>
            </tr>
          </thead>
          <tbody>
            {list.map((r: any) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{r.title}</td>
                <td className="px-2 text-muted-foreground">{r.category}</td>
                <td className="px-2">{r.qty}</td>
                <td className="px-2 text-muted-foreground">{r.region}</td>
                <td className="px-2"><span className="chip chip-verified">{r.status}</span></td>
                <td className="px-2 text-right font-semibold">{r.responses ?? 0}</td>
                <td className="px-4 text-right">
                  <Link to="/rfq/$id" params={{ id: r.id }} className="text-primary text-xs font-semibold">View →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
