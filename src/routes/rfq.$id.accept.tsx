import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { formatPhp, supplierById } from "@/lib/mock-data";
import type { DeliveryMethod } from "@/lib/mock-data";
import { getRfq, useRfq, selectSupplier } from "@/lib/rfq-store";
import { createOrderFromRfq } from "@/lib/cart";
import { useAuth } from "@/lib/auth-store";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ShieldCheck, Truck, Package, Building2, CheckCircle2, ArrowRight, FileText } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({ supplier: z.string().optional() });

export const Route = createFileRoute("/rfq/$id/accept")({
  validateSearch: searchSchema,
  loader: ({ params }) => {
    const r = getRfq(params.id);
    if (!r) throw notFound();
    return { id: params.id };
  },
  head: () => ({ meta: [{ title: "Confirm order — PSG" }] }),
  notFoundComponent: () => (
    <AppShell>
      <div className="p-20 text-center">
        <h1 className="font-display text-3xl">Quote request not found</h1>
        <Link to="/rfq" className="text-primary underline mt-4 inline-block">Back to RFQ Center</Link>
      </div>
    </AppShell>
  ),
  errorComponent: ({ reset }) => (
    <AppShell><div className="p-12 text-center"><button onClick={reset} className="border px-4 py-2 rounded">Retry</button></div></AppShell>
  ),
  component: AcceptQuote,
});

const DELIVERY_OPTIONS: { key: DeliveryMethod; icon: any; title: string; desc: string; feeHint: string }[] = [
  { key: "pickup", icon: Building2, title: "Warehouse Pickup", desc: "Pick up from the supplier's warehouse.", feeHint: "No delivery fee" },
  { key: "carrier", icon: Truck, title: "3rd-Party Carrier", desc: "Standard courier (LBC / J&T / Lalamove).", feeHint: "Delivery fee applies" },
  { key: "supplier", icon: Package, title: "Supplier Delivery", desc: "Supplier arranges direct delivery.", feeHint: "Set by supplier" },
];

function AcceptQuote() {
  const { id } = Route.useLoaderData();
  const search = Route.useSearch();
  const rfq = useRfq(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const quote = rfq?.quotes.find((q) => q.supplierId === search.supplier) || rfq?.quotes[0];
  const [method, setMethod] = useState<DeliveryMethod>(quote?.deliveryMethod ?? rfq?.preferredDeliveryMethod ?? "supplier");
  const [invoice, setInvoice] = useState(rfq?.invoiceRequired ?? true);
  const [address, setAddress] = useState(rfq?.deliveryLocation || "");
  const [contact, setContact] = useState(user?.fullName || "");
  const [phone, setPhone] = useState("+63 917 000 0000");
  const [instructions, setInstructions] = useState("");
  const [payment, setPayment] = useState("Bank Transfer (Escrow)");
  const [placing, setPlacing] = useState(false);

  if (!rfq || !quote) {
    return (
      <AppShell>
        <div className="p-20 text-center">
          <h1 className="font-display text-2xl">No quote selected</h1>
          <Link to="/rfq/$id" params={{ id }} className="text-primary underline mt-3 inline-block">Back to comparison</Link>
        </div>
      </AppShell>
    );
  }

  const s = supplierById(quote.supplierId);
  const qtyNum = parseFloat(rfq.qty.match(/[\d.]+/)?.[0] || "1") || 1;
  const unit = rfq.unit || "unit";
  const unitPrice = quote.pricePhp;
  const subtotal = qtyNum * unitPrice;
  const deliveryFee = method === "pickup" ? 0 : quote.deliveryFee ?? (method === "carrier" ? 500 : 0);
  const total = subtotal + deliveryFee;

  function placeOrder() {
    setPlacing(true);
    try {
      const order = createOrderFromRfq({
        rfqId: rfq!.id,
        title: rfq!.title,
        buyer: user?.businessName || rfq!.buyer,
        supplierId: quote!.supplierId,
        qty: qtyNum,
        unit,
        unitPrice,
        deliveryFee,
        deliveryMethod: method,
        invoiceRequired: invoice,
        payment,
        address: {
          business: user?.businessName || rfq!.buyer,
          contact,
          phone,
          address: address || rfq!.deliveryLocation || rfq!.region,
          instructions,
        },
      });
      selectSupplier(rfq!.id, quote!.supplierId);
      toast.success("Order placed. Funds are held in escrow until delivery.");
      navigate({ to: "/orders/$id", params: { id: order.id } });
    } finally {
      setPlacing(false);
    }
  }

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <Link to="/rfq/$id" params={{ id }} className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Back to quote comparison
          </Link>
          <h1 className="font-display text-3xl mt-2">Confirm your order</h1>
          <p className="text-sm text-muted-foreground">Review terms, choose delivery, and place your order — funds are protected by escrow.</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-5">
          {/* Selected quote */}
          <div className="rounded-lg border-2 border-primary bg-card p-5">
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
              <CheckCircle2 size={14} /> Selected supplier
            </div>
            <div className="mt-2 flex items-start gap-3">
              <div className="size-12 rounded-md bg-gradient-to-br from-primary to-gold grid place-items-center text-white font-display text-lg shrink-0">{s.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold flex items-center gap-1.5">
                  {s.name} {s.verified && <ShieldCheck size={14} className="text-success" />}
                </div>
                <div className="text-xs text-muted-foreground">{s.location} · Lead time {quote.leadTimeDays} days · MOQ {quote.moq}</div>
                {quote.paymentTerms && <div className="text-xs mt-1">Payment terms: <b>{quote.paymentTerms}</b></div>}
              </div>
              <div className="text-right shrink-0">
                <div className="font-display text-xl">{formatPhp(unitPrice)}</div>
                <div className="text-xs text-muted-foreground">per {unit}</div>
              </div>
            </div>
          </div>

          {/* Delivery method */}
          <div className="rounded-lg border bg-card p-5">
            <h2 className="font-semibold mb-3">Delivery method</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {DELIVERY_OPTIONS.map((opt) => {
                const active = method === opt.key;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setMethod(opt.key)}
                    className={`text-left p-4 rounded-lg border-2 transition ${active ? "border-primary bg-primary/5" : "hover:border-primary/40"}`}
                  >
                    <Icon size={20} className={active ? "text-primary" : "text-muted-foreground"} />
                    <div className="font-semibold text-sm mt-2">{opt.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
                    <div className="text-[11px] text-primary font-semibold mt-2">{opt.feeHint}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 space-y-3">
              <Field label="Delivery / pickup address">
                <input className={inputCls} value={address} onChange={(e) => setAddress(e.target.value)} />
              </Field>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Contact person"><input className={inputCls} value={contact} onChange={(e) => setContact(e.target.value)} /></Field>
                <Field label="Contact phone"><input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
              </div>
              <Field label="Delivery instructions (optional)">
                <textarea className={`${inputCls} min-h-[70px]`} value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Gate code, preferred window, unloading dock…" />
              </Field>
            </div>
          </div>

          {/* Payment + Invoice */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <h2 className="font-semibold">Payment & documents</h2>
            <Field label="Payment method">
              <select className={inputCls} value={payment} onChange={(e) => setPayment(e.target.value)}>
                <option>Bank Transfer (Escrow)</option>
                <option>GCash Business (Escrow)</option>
                <option>Corporate Card (Escrow)</option>
              </select>
            </Field>
            <label className="flex items-start gap-3 p-3 rounded-md border">
              <input type="checkbox" checked={invoice} onChange={(e) => setInvoice(e.target.checked)} className="mt-1" />
              <div>
                <div className="text-sm font-semibold flex items-center gap-1"><FileText size={14} /> Request BIR-compliant invoice</div>
                <div className="text-xs text-muted-foreground">Supplier issues an official receipt / VAT invoice on release.</div>
              </div>
            </label>
          </div>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-lg border bg-card p-5">
            <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Order summary</div>
            <div className="mt-3 pb-3 border-b">
              <div className="font-semibold text-sm">{rfq.title}</div>
              <div className="text-xs text-muted-foreground">{qtyNum} × {unit}</div>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <Row k={`Subtotal (${qtyNum} × ${formatPhp(unitPrice)})`} v={formatPhp(subtotal)} />
              <Row k={`Delivery (${method})`} v={deliveryFee ? formatPhp(deliveryFee) : "Free"} />
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between font-display text-lg">
                  <span>Total</span>
                  <span>{formatPhp(total)}</span>
                </div>
              </div>
            </dl>
            <div className="mt-4 rounded-md bg-success/10 border border-success/30 p-3 flex items-start gap-2">
              <ShieldCheck size={16} className="text-success shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-success">PSG Escrow protection</div>
                <p className="text-muted-foreground mt-0.5">Funds are held safely and only released to the supplier after you confirm delivery.</p>
              </div>
            </div>
            <button
              onClick={placeOrder}
              disabled={placing || !address || !contact}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-md disabled:opacity-50"
            >
              {placing ? "Placing order…" : (<>Place order (Escrow) <ArrowRight size={16} /></>)}
            </button>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">By placing this order you agree to PSG's Terms and escrow policy.</p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

const inputCls =
  "w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
  );
}
