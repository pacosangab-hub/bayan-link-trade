import { createFileRoute, Link } from "@tanstack/react-router";
import { getAllOffers } from "@/lib/offers-store";
import { formatPhp } from "@/lib/mock-data";

export const Route = createFileRoute("/buyer-portal/offers")({
  component: BuyerOffers,
});

function BuyerOffers() {
  let offers: any[] = [];
  try { offers = getAllOffers(); } catch { offers = []; }
  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Supplier Offers ({offers.length})</h2>
      {offers.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-10 text-center text-sm text-muted-foreground">
          No offers yet. Post a quote request and suppliers will send custom offers.
          <div className="mt-3">
            <Link to="/rfq/new" className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded font-semibold">Post Quote Request</Link>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground border-b bg-muted/40">
              <tr>
                <th className="text-left px-4 py-2.5">Offer</th>
                <th className="text-left px-2">Supplier</th>
                <th className="text-left px-2">Product</th>
                <th className="text-right px-2">Total</th>
                <th className="text-left px-2">Status</th>
                <th className="text-right px-4"></th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{o.id.toUpperCase()}</td>
                  <td className="px-2">{o.supplierName || o.supplierId}</td>
                  <td className="px-2 text-muted-foreground truncate max-w-[240px]">{o.productTitle || o.title || "—"}</td>
                  <td className="px-2 text-right font-semibold text-primary">{formatPhp(o.totalPhp || o.total || 0)}</td>
                  <td className="px-2"><span className="chip">{o.status}</span></td>
                  <td className="px-4 text-right">
                    <Link to="/offers/$id" params={{ id: o.id }} className="text-primary text-xs font-semibold">Review →</Link>
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
