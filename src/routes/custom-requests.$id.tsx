import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useRequest, useAllOffers, getRequest, requestStatusChip, offerStatusChip, formatPhp, supplierById } from "@/lib/offers-store";
import { useState } from "react";
import { SendCustomOfferModal } from "@/components/offers/SendCustomOfferModal";
import { MapPin, Calendar, Package, Wallet, MessageSquare, ArrowRight, Send, FileText, Sparkles } from "lucide-react";

export const Route = createFileRoute("/custom-requests/$id")({
  loader: ({ params }) => {
    const r = getRequest(params.id);
    if (!r) throw notFound();
    return { id: params.id };
  },
  head: () => ({ meta: [{ title: "Custom Request — PSG" }] }),
  notFoundComponent: () => (
    <AppShell><div className="p-20 text-center">
      <h1 className="font-display text-3xl">Request not found</h1>
      <Link to="/custom-requests" className="text-primary underline mt-4 inline-block">Back to Custom Requests</Link>
    </div></AppShell>
  ),
  component: CustomRequestDetail,
});

function CustomRequestDetail() {
  const { id } = Route.useLoaderData();
  const req = useRequest(id);
  const allOffers = useAllOffers();
  const [modalOpen, setModalOpen] = useState(false);

  if (!req) return null;
  const s = supplierById(req.supplierId);
  const offers = allOffers.filter((o) => o.requestId === id);
  const latestOffer = offers[0];

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Link to="/custom-requests" className="text-xs text-muted-foreground hover:text-primary">← Back to Custom Requests</Link>
          <div className="mt-2 flex items-center gap-2 flex-wrap mb-1">
            <span className="chip chip-primary">{req.category}</span>
            <span className={`chip ${requestStatusChip(req.status)}`}>{req.status}</span>
            <span className="text-xs text-muted-foreground">{req.createdAt}</span>
          </div>
          <h1 className="font-display text-3xl">{req.productName}</h1>
          <div className="text-sm text-muted-foreground mt-1">From <strong>{req.buyerBusiness}</strong> · {req.buyerType} · to {s.name}</div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-5">
          <Card title="Buyer request">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Field icon={<Package size={14} />} label="Quantity" value={`${req.qty} ${req.unit}`} />
              <Field icon={<Wallet size={14} />} label="Target budget" value={formatPhp(req.budgetPhp)} />
              <Field icon={<MapPin size={14} />} label="Delivery location" value={req.deliveryLocation} />
              <Field icon={<Calendar size={14} />} label="Needed by" value={req.neededBy} />
              <Field label="Order type" value={req.recurring} />
              <Field label="Industry" value={req.industry} />
            </div>
            <Section label="Custom requirements">{req.requirements || "—"}</Section>
            <Section label="Packaging">{req.packaging || "—"}</Section>
            <Section label="Certifications">{req.certifications || "—"}</Section>
            <Section label="Delivery requirements">{req.deliveryRequirements || "—"}</Section>
            <Section label="Message to supplier">{req.message || "—"}</Section>
            {req.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {req.attachments.map((a) => (
                  <span key={a} className="chip"><FileText size={12} /> {a}</span>
                ))}
              </div>
            )}
          </Card>

          <Card title={`Offer history · ${offers.length}`}>
            {offers.length === 0 ? (
              <div className="text-sm text-muted-foreground">No offers yet. Send the first one to win this buyer.</div>
            ) : (
              <div className="space-y-3">
                {offers.map((o) => (
                  <Link key={o.id} to="/offers/$id" params={{ id: o.id }} className="block border rounded-md p-3 hover:bg-muted/40">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm">v{o.version} · {o.title}</div>
                      <span className={`chip ${offerStatusChip(o.status)}`}>{o.status}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatPhp(o.unitPrice)}/{o.unit} · lead {o.leadTimeDays}d · total {formatPhp(o.breakdown.total)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <div className="text-[10px] uppercase tracking-widest text-primary font-bold flex items-center gap-1">
              <Sparkles size={12} /> Supplier action
            </div>
            <h3 className="font-display text-xl mt-1">{latestOffer ? `Revise offer (v${latestOffer.version + 1})` : "Send a Custom Offer"}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Fill out the proposal form — pricing breakdown, delivery schedule, payment terms, and escrow.
            </p>
            <button onClick={() => setModalOpen(true)}
              className="mt-4 w-full bg-primary text-primary-foreground rounded-md py-2.5 font-semibold text-sm inline-flex items-center justify-center gap-1.5 hover:bg-primary/90">
              <Send size={14} /> {latestOffer ? "Revise Offer" : "Send Custom Offer"}
            </button>
            <Link to="/messages" className="mt-2 w-full border rounded-md py-2 text-sm font-semibold text-center flex items-center justify-center gap-1.5 hover:bg-muted">
              <MessageSquare size={14} /> Message Buyer
            </Link>
          </div>

          {latestOffer && (
            <div className="rounded-lg border bg-card p-4 text-sm">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Latest offer</div>
              <div className="font-semibold">{latestOffer.title}</div>
              <div className="text-xs text-muted-foreground">v{latestOffer.version} · {latestOffer.status}</div>
              <div className="mt-2 font-display text-xl text-primary">{formatPhp(latestOffer.breakdown.total)}</div>
              <Link to="/offers/$id" params={{ id: latestOffer.id }}
                className="mt-2 text-xs font-semibold text-primary inline-flex items-center gap-1">
                View proposal <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </aside>
      </div>

      <SendCustomOfferModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        supplierId={req.supplierId}
        request={req}
        revisingOffer={latestOffer}
      />
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
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
      <div className="text-sm mt-1 whitespace-pre-wrap">{children}</div>
    </div>
  );
}
