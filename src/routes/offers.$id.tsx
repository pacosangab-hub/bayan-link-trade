import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { VerifiedBadge, Rating } from "@/components/ui-bits";
import { useOffer, getOffer, useRequest, acceptOffer, rejectOffer, offerStatusChip, formatPhp, supplierById } from "@/lib/offers-store";
import { useState } from "react";
import { RequestChangesModal } from "@/components/offers/RequestChangesModal";
import {
  ShieldCheck, MessageSquare, CheckCircle2, X, MapPin, Calendar, Package, Truck,
  FileText, Clock, Award, Building2, Wallet, Sparkles, ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/offers/$id")({
  loader: ({ params }) => {
    const o = getOffer(params.id);
    if (!o) throw notFound();
    return { id: params.id };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `Custom Offer ${loaderData?.id ?? ""} — PSG` }] }),
  notFoundComponent: () => (
    <AppShell><div className="p-20 text-center">
      <h1 className="font-display text-3xl">Offer not found</h1>
      <Link to="/offers" className="text-primary underline mt-4 inline-block">Back to Custom Offers</Link>
    </div></AppShell>
  ),
  component: OfferDetail,
});

function OfferDetail() {
  const { id } = Route.useLoaderData();
  const offer = useOffer(id);
  const req = useRequest(offer?.requestId ?? "");
  const [confirmAccept, setConfirmAccept] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const navigate = useNavigate();

  if (!offer) return null;
  const s = supplierById(offer.supplierId);

  function doAccept() {
    const order = acceptOffer(offer!.id);
    setConfirmAccept(false);
    if (order) {
      toast.success("Custom offer accepted. Order has been created.");
      navigate({ to: "/orders/$id", params: { id: order.id } });
    }
  }
  function doReject() {
    if (!confirm("Reject this custom offer? The supplier will be notified.")) return;
    rejectOffer(offer!.id);
    toast.success("Offer rejected.");
  }

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Link to="/offers" className="text-xs text-muted-foreground hover:text-primary">← Back to Custom Offers</Link>
          <div className="mt-2 flex items-center gap-2 flex-wrap mb-1">
            <span className="chip chip-primary">{offer.category}</span>
            <span className={`chip ${offerStatusChip(offer.status)}`}>{offer.status}</span>
            <span className="chip">Offer v{offer.version}</span>
            <span className="text-xs text-muted-foreground">Sent {offer.createdAt}</span>
          </div>
          <h1 className="font-display text-3xl">Custom Offer from {s.name}</h1>
          <div className="text-sm text-muted-foreground mt-1">{offer.title}</div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[1fr_380px] gap-6">
        {/* Left: proposal breakdown */}
        <div className="space-y-5">
          {/* Supplier card */}
          <div className="rounded-lg border bg-card p-5 flex items-start gap-4">
            <div className="size-14 rounded-md bg-gradient-to-br from-primary to-gold grid place-items-center text-white font-display text-2xl shrink-0">
              {s.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{s.name}</span>
                {s.verified && <VerifiedBadge />}
                {s.goldSupplier && <VerifiedBadge gold />}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-2 items-center">
                <span className="inline-flex items-center gap-1"><Building2 size={12} /> {s.type} · {s.location}</span>
                <span>·</span>
                <Rating value={s.rating} count={s.reviews} />
              </div>
            </div>
            <Link to="/suppliers/$id" params={{ id: s.id }} className="text-xs text-primary font-semibold whitespace-nowrap">Supplier profile →</Link>
          </div>

          {/* Proposal */}
          <Card title="Proposal">
            <div className="text-sm whitespace-pre-wrap">{offer.description || "—"}</div>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <Field icon={<Package size={14} />} label="Quantity" value={`${offer.qty} ${offer.unit}`} />
              <Field icon={<Wallet size={14} />} label="Unit price" value={`${formatPhp(offer.unitPrice)}/${offer.unit}`} />
              <Field icon={<Truck size={14} />} label="Lead time" value={`${offer.leadTimeDays} days`} />
              <Field icon={<Calendar size={14} />} label="Delivery schedule" value={offer.deliverySchedule} />
              <Field icon={<MapPin size={14} />} label="Delivery location" value={offer.deliveryLocation} />
              <Field icon={<Clock size={14} />} label="Valid until" value={offer.validUntil} />
              <Field label="Payment terms" value={offer.paymentTerms} />
              <Field label="MOQ" value={`${offer.moq} ${offer.unit}`} />
              <Field label="Stock" value={offer.stock} />
              <Field label="Warranty" value={offer.warranty} />
            </div>
            {offer.certifications && (
              <div className="mt-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Certifications</div>
                <div className="text-sm mt-1 flex items-center gap-1.5"><Award size={14} className="text-gold" /> {offer.certifications}</div>
              </div>
            )}
            {offer.notes && (
              <div className="mt-3 rounded-md bg-muted/50 p-3 text-sm">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Supplier notes</div>
                {offer.notes}
              </div>
            )}
            {offer.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {offer.attachments.map((a) => (
                  <span key={a} className="chip"><FileText size={12} /> {a}</span>
                ))}
              </div>
            )}
          </Card>

          {offer.recurring?.enabled && (
            <Card title="Recurring / contract terms">
              <div className="grid sm:grid-cols-3 gap-3 text-sm">
                <Field label="Schedule" value={offer.recurring.schedule} />
                <Field label="Duration" value={offer.recurring.duration} />
                <Field label="Price lock" value={`${offer.recurring.priceLockMonths} months`} />
              </div>
            </Card>
          )}

          {/* Version history */}
          {offer.versions.length > 1 && (
            <Card title="Version history">
              <div className="space-y-2 text-sm">
                {offer.versions.map((v) => (
                  <div key={v.version} className="flex items-center justify-between border rounded-md px-3 py-2">
                    <div>
                      <div className="font-semibold">Offer v{v.version} <span className="text-xs text-muted-foreground">· {v.createdAt}</span></div>
                      <div className="text-xs text-muted-foreground">{v.notes}</div>
                    </div>
                    <div className="text-right text-xs">
                      <div><strong>{formatPhp(v.unitPrice)}</strong>/{offer.unit}</div>
                      <div className="text-muted-foreground">lead {v.leadTimeDays}d · ship {formatPhp(v.deliveryFee)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Timeline */}
          <Card title="Timeline">
            <ol className="relative border-l pl-5 space-y-4">
              {offer.timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span className={`absolute -left-[27px] top-1 size-3 rounded-full ${t.actor === "buyer" ? "bg-primary" : t.actor === "supplier" ? "bg-gold" : "bg-success"}`} />
                  <div className="text-sm font-medium">{t.label}</div>
                  <div className="text-xs text-muted-foreground">{t.at} · {t.actor}</div>
                </li>
              ))}
            </ol>
          </Card>

          {req && (
            <Card title="Original buyer request">
              <div className="text-sm">
                <div className="font-semibold">{req.productName}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {req.qty} {req.unit} · target {formatPhp(req.budgetPhp)} · deliver to {req.deliveryLocation}
                </div>
                <Link to="/custom-requests/$id" params={{ id: req.id }} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  View request <ArrowRight size={12} />
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Right: pricing + actions */}
        <aside className="lg:sticky lg:top-32 self-start space-y-4">
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-1">
              <Sparkles size={12} /> Supplier proposal
            </div>
            <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">Total payable</div>
            <div className="font-display text-4xl text-primary leading-none mt-1">{formatPhp(offer.breakdown.total)}</div>

            <div className="mt-4 space-y-1 text-sm">
              <Row label={`Product (${offer.qty} × ${formatPhp(offer.unitPrice)})`} value={formatPhp(offer.breakdown.product)} />
              <Row label="Delivery" value={formatPhp(offer.breakdown.delivery)} />
              <Row label="PSG platform fee" value={formatPhp(offer.breakdown.platform)} sub />
              <Row label="VAT (12%)" value={formatPhp(offer.breakdown.vat)} sub />
            </div>

            {offer.escrowAvailable && (
              <div className="mt-4 rounded-md bg-success/10 text-success text-xs p-3 flex gap-2">
                <ShieldCheck size={14} className="shrink-0 mt-0.5" />
                <span>Escrow protection: funds are released to the supplier <strong>only after you confirm delivery</strong>.</span>
              </div>
            )}

            {offer.status === "Pending Review" || offer.status === "Changes Requested" ? (
              <div className="mt-4 space-y-2">
                <button onClick={() => setConfirmAccept(true)}
                  className="w-full bg-primary text-primary-foreground font-semibold rounded-md py-3 hover:bg-primary/90 inline-flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={16} /> Accept Offer
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setChangesOpen(true)} className="border rounded-md py-2 text-sm font-semibold hover:bg-muted">
                    Request Changes
                  </button>
                  <button onClick={doReject} className="border rounded-md py-2 text-sm font-semibold hover:bg-muted text-destructive">
                    Reject
                  </button>
                </div>
                <Link to="/messages" className="w-full border rounded-md py-2 text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-muted">
                  <MessageSquare size={14} /> Message Supplier
                </Link>
              </div>
            ) : offer.status === "Converted to Order" && offer.orderId ? (
              <div className="mt-4 space-y-2">
                <Link to="/orders/$id" params={{ id: offer.orderId }}
                  className="w-full bg-primary text-primary-foreground font-semibold rounded-md py-3 text-center hover:bg-primary/90 flex items-center justify-center gap-1.5">
                  <Truck size={16} /> Track Order
                </Link>
                <div className="text-xs text-center text-success">Order {offer.orderId.toUpperCase()} · escrow funded</div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-muted-foreground text-center">Offer {offer.status.toLowerCase()}.</div>
            )}
          </div>
        </aside>
      </div>

      {/* Accept confirmation modal */}
      {confirmAccept && (
        <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 animate-fade-in" onClick={() => setConfirmAccept(false)}>
          <div className="bg-card rounded-lg w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="border-b px-5 py-3 flex items-center justify-between">
              <h2 className="font-display text-xl">Accept this custom offer?</h2>
              <button onClick={() => setConfirmAccept(false)} className="p-1.5 rounded hover:bg-muted"><X size={18} /></button>
            </div>
            <div className="p-5 text-sm text-muted-foreground">
              Once accepted, this offer will become an order. You can proceed to <strong className="text-foreground">escrow-protected payment</strong> and track fulfillment.
              <div className="mt-3 rounded-md bg-muted/60 p-3 text-foreground">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase text-muted-foreground">Total payable</span>
                  <span className="font-display text-2xl text-primary">{formatPhp(offer.breakdown.total)}</span>
                </div>
              </div>
            </div>
            <div className="border-t px-5 py-3 flex items-center justify-end gap-2">
              <button onClick={() => setConfirmAccept(false)} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
              <button onClick={doAccept} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Accept and Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      <RequestChangesModal open={changesOpen} onClose={() => setChangesOpen(false)} offerId={offer.id} />
    </AppShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="font-semibold mb-3">{title}</div>
      {children}
    </div>
  );
}
function Field({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-2.5">
      <div className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">{icon} {label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
function Row({ label, value, sub }: { label: string; value: string; sub?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${sub ? "text-xs text-muted-foreground" : ""}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
