import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { getOffer, useOffer, acceptOffer, formatPhp, supplierById } from "@/lib/offers-store";
import { ShieldCheck, Wallet, CreditCard, Building2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/offers/$id/checkout")({
  loader: ({ params }) => {
    const o = getOffer(params.id);
    if (!o) throw notFound();
    return { id: params.id };
  },
  head: () => ({ meta: [{ title: "Pay with Escrow — PSG" }] }),
  component: OfferCheckout,
});

function OfferCheckout() {
  const { id } = Route.useLoaderData();
  const offer = useOffer(id);
  const navigate = useNavigate();
  const [method, setMethod] = useState<"GCash" | "Maya" | "Bank">("GCash");

  if (!offer) return null;
  const s = supplierById(offer.supplierId);

  function pay() {
    const order = acceptOffer(offer!.id);
    if (order) {
      toast.success("Escrow funded. Supplier notified to begin fulfillment.");
      navigate({ to: "/orders/$id", params: { id: order.id } });
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Link to="/offers/$id" params={{ id }} className="text-xs text-muted-foreground hover:text-primary">← Back to offer</Link>
        <h1 className="font-display text-3xl mt-2">Pay with Escrow</h1>
        <p className="text-sm text-muted-foreground">Custom offer from <strong>{s.name}</strong> · {offer.title}</p>

        <div className="mt-6 grid md:grid-cols-[1fr_320px] gap-5">
          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-5">
              <div className="font-semibold mb-2">Payment method</div>
              <div className="grid grid-cols-3 gap-2">
                {(["GCash", "Maya", "Bank"] as const).map((m) => (
                  <button key={m} onClick={() => setMethod(m)}
                    className={`rounded-md border py-3 text-sm font-semibold ${method === m ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted"}`}>
                    <CreditCard size={16} className="mx-auto mb-1" /> {m}
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-md bg-success/10 text-success text-xs p-3 flex gap-2">
                <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                Funds are released to the supplier <strong>after delivery is confirmed</strong>. PSG holds your money in escrow.
              </div>
            </div>
            <div className="rounded-lg border bg-card p-5">
              <div className="font-semibold mb-2">Business delivery details</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Building2 size={14} /> {offer.buyerBusiness} · {offer.deliveryLocation}
              </div>
            </div>
          </div>

          <aside className="rounded-lg border bg-card p-5 h-fit">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Order summary</div>
            <div className="mt-2 text-sm space-y-1">
              <Row label={`Product (${offer.qty} × ${formatPhp(offer.unitPrice)})`} value={formatPhp(offer.breakdown.product)} />
              <Row label="Delivery fee" value={formatPhp(offer.breakdown.delivery)} />
              <Row label="PSG platform fee" value={formatPhp(offer.breakdown.platform)} sub />
              <Row label="VAT (12%)" value={formatPhp(offer.breakdown.vat)} sub />
            </div>
            <div className="border-t mt-3 pt-3 flex items-baseline justify-between">
              <span className="text-sm">Total payable</span>
              <span className="font-display text-2xl text-primary">{formatPhp(offer.breakdown.total)}</span>
            </div>
            <button onClick={pay} className="mt-4 w-full bg-primary text-primary-foreground font-semibold rounded-md py-3 inline-flex items-center justify-center gap-1.5 hover:bg-primary/90">
              <Wallet size={16} /> Pay {formatPhp(offer.breakdown.total)} into Escrow
            </button>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${sub ? "text-xs text-muted-foreground" : ""}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
