import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { supplierById, productById, formatPhp, orders as MOCK_ORDERS } from "@/lib/mock-data";
import {
  MessageSquare, ShieldAlert, ShieldCheck, CheckCircle2, Clock, Circle,
  Upload, X, Image as ImageIcon, MapPin, BadgeCheck, AlertTriangle, FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  useDemoOrder, ensureDemoOrder, currentStage, nextStage, advanceStage,
  addProof, confirmDeliveryAndRelease, disputeOrder,
  type DemoOrder, type StageKey, type ProofType, type Proof,
} from "@/lib/cart";
import { useDemoRole } from "@/lib/demo/session";
import { pushNotification } from "@/lib/demo/notifications";
import { toast } from "sonner";

export const Route = createFileRoute("/orders/$id")({
  head: ({ params }) => ({ meta: [{ title: `Order ${params.id} — PSG` }] }),
  component: OrderDetailPage,
});

// ---- Timeline definition ----
const STEPS: { key: StageKey; title: string; blurb: string; proofLabel: string }[] = [
  { key: "created",         title: "Order Created",     blurb: "Order details generated from accepted offer.", proofLabel: "Custom offer accepted" },
  { key: "funded",          title: "Escrow Funded",     blurb: "Your payment is being held safely by PSG.", proofLabel: "Demo escrow funded" },
  { key: "confirmed",       title: "Supplier Confirmed", blurb: "Supplier accepted the order and started fulfillment.", proofLabel: "Supplier confirmation" },
  { key: "preparing",       title: "Preparing Shipment", blurb: "Goods are being picked, packed and labeled.", proofLabel: "Packed goods photo" },
  { key: "ready",           title: "Ready for Pickup",   blurb: "Goods are staged at the warehouse for pickup.", proofLabel: "Packing list" },
  { key: "transit",         title: "In Transit",         blurb: "Shipment is on the way to the delivery address.", proofLabel: "Driver details" },
  { key: "delivered",       title: "Delivered",          blurb: "Shipment arrived at the buyer's location.", proofLabel: "Proof of delivery" },
  { key: "buyer_confirmed", title: "Buyer Confirmed",    blurb: "Buyer confirmed the order was received correctly.", proofLabel: "Buyer confirmation" },
  { key: "released",        title: "Escrow Released",    blurb: "Funds released to the supplier — order complete.", proofLabel: "Escrow release receipt" },
];

function OrderDetailPage() {
  const { id } = Route.useParams();
  const [hydrated, setHydrated] = useState(false);

  // Hydrate mock order to localStorage on first view (client-only)
  useEffect(() => {
    ensureDemoOrder(id);
    setHydrated(true);
  }, [id]);

  const o = useDemoOrder(id);
  const role = useDemoRole();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadStage, setUploadStage] = useState<StageKey>("preparing");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);

  if (!o) {
    if (hydrated && !MOCK_ORDERS.some((x) => x.id === id)) return <OrderNotFound orderId={id} />;
    return <AppShell><div className="p-20 text-center text-muted-foreground">Loading order…</div></AppShell>;
  }

  const s = supplierById(o.supplierId);
  const firstProduct = productById(o.items[0].productId);
  const cur = currentStage(o);
  const isDisputed = o.escrowState === "Disputed";
  const isComplete = o.escrowState === "Released to Supplier";

  const productTitleLine = o.items.length === 1
    ? `${firstProduct.title} — ${o.items[0].qty.toLocaleString()} ${firstProduct.unit}`
    : `${firstProduct.title} + ${o.items.length - 1} more`;

  function openUpload(stage: StageKey) {
    setUploadStage(stage);
    setUploadOpen(true);
  }

  function handleAdvance(to: StageKey) {
    advanceStage(o!.id, to);
    toast.success(`Marked as ${STEPS.find(s => s.key === to)?.title}`);
    pushNotification({
      role: "buyer", kind: "order",
      title: `Order ${o!.id.toUpperCase()} update`,
      body: `Supplier marked as ${STEPS.find(s => s.key === to)?.title}.`,
      href: `/orders/${o!.id}`,
    });
  }

  function handleConfirmDelivery() {
    confirmDeliveryAndRelease(o!.id);
    setConfirmOpen(false);
    toast.success("Delivery confirmed — escrow released to supplier");
    pushNotification({
      role: "supplier", kind: "escrow",
      title: `Escrow released for ${o!.id.toUpperCase()}`,
      body: "Buyer confirmed delivery. Funds released to your account.",
      href: `/orders/${o!.id}`,
    });
  }

  function handleDispute(issueType: string, description: string) {
    disputeOrder(o!.id, { issueType, description, at: new Date().toLocaleString("en-PH") });
    setDisputeOpen(false);
    toast.error("Problem reported — escrow frozen while we review");
    pushNotification({
      role: "supplier", kind: "dispute",
      title: `Dispute opened on ${o!.id.toUpperCase()}`,
      body: `${issueType} — escrow frozen`,
      href: `/orders/${o!.id}`,
    });
    pushNotification({
      role: "admin", kind: "dispute",
      title: `Dispute needs review`,
      body: `${o!.id.toUpperCase()} · ${issueType}`,
      href: "/admin/safety",
    });
  }

  return (
    <AppShell>
      {/* Header */}
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-5xl px-4 py-5">
          <Link to="/orders" className="text-xs text-muted-foreground hover:text-primary">← All orders</Link>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
            <h1 className="font-display text-3xl">Order {o.id.toUpperCase()}</h1>
            <StatusBadge state={o.escrowState} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Top: summary + protection */}
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-4">
          {/* Summary */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">Order Summary</div>
            <div className="mt-2 flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-xl leading-tight">{productTitleLine}</div>
                <Link
                  to="/suppliers/$id" params={{ id: s.id }}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
                >
                  {s.name}
                  {s.verified && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-success">
                      <BadgeCheck size={12} /> Verified
                    </span>
                  )}
                </Link>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</div>
                <div className="font-display text-2xl text-primary">{formatPhp(o.totalPhp)}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <SummaryField label="Placed" value={o.placed} />
              <SummaryField label="Delivery location" value={o.address?.business ?? "—"} sub={o.address?.address} />
              <SummaryField label="Order status" value={STEPS.find(x => x.key === cur)?.title ?? "In progress"} />
              <SummaryField label="Escrow status" value={o.escrowState} />
              <SummaryField label="Payment" value={o.payment} />
            </div>
          </div>

          {/* Buyer protection */}
          <div className={`rounded-xl border-2 p-5 ${isDisputed ? "border-destructive/50 bg-destructive/5" : "border-success/40 bg-success/5"}`}>
            <div className="flex items-center gap-2 text-success font-semibold">
              {isDisputed ? <AlertTriangle size={18} className="text-destructive" /> : <ShieldCheck size={18} />}
              <span className={isDisputed ? "text-destructive" : ""}>
                {isDisputed ? "Escrow Frozen — Under Review" : "Buyer Protection Active"}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {isDisputed
                ? "You reported a problem with this order. Your payment is held by PSG while our safety team reviews the dispute."
                : "Your payment is held safely in escrow. The supplier only gets paid after you confirm the order was delivered correctly."}
            </p>
            <ul className="mt-3 space-y-1.5 text-xs">
              <ProtBullet done={!!o.stages?.funded}>Escrow Funded</ProtBullet>
              <ProtBullet done={(o.proofs?.length ?? 0) > 0}>Supplier uploads proof at each step</ProtBullet>
              <ProtBullet done={!!o.stages?.buyer_confirmed}>Buyer confirms delivery before release</ProtBullet>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <ActionBar
          order={o} role={role} isDisputed={isDisputed} isComplete={isComplete}
          onSupplierAdvance={handleAdvance}
          onSupplierUpload={() => openUpload(cur === "released" ? "delivered" : cur)}
          onBuyerConfirm={() => setConfirmOpen(true)}
          onBuyerReport={() => setDisputeOpen(true)}
        />

        {/* Delivery Method */}
        <DeliveryMethodPanel orderId={o.id} />


        {/* Timeline */}
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-1 font-display text-xl">Order Timeline</div>
          <p className="text-xs text-muted-foreground mb-5">
            Track each step from order creation to delivery confirmation.
          </p>
          <ol className="relative">
            {STEPS.map((step, i) => {
              const rec = o.stages?.[step.key];
              const done = !!rec;
              const isCurrent = step.key === cur && !isComplete;
              const stepProofs = (o.proofs ?? []).filter((p) => p.stage === step.key);
              const status: "Completed" | "Current" | "Waiting" =
                done && !isCurrent ? "Completed" : isCurrent ? "Current" : "Waiting";
              const isLast = i === STEPS.length - 1;
              return (
                <li key={step.key} className="relative pl-10 pb-6">
                  {!isLast && <span className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />}
                  <span
                    className={`absolute left-0 top-1 size-8 rounded-full grid place-items-center border-2 ${
                      done ? "bg-success border-success text-white"
                        : isCurrent ? "bg-primary border-primary text-white animate-pulse"
                        : "bg-background border-border text-muted-foreground"
                    }`}
                  >
                    {done ? <CheckCircle2 size={16} /> : isCurrent ? <Clock size={16} /> : <Circle size={14} />}
                  </span>
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="font-semibold text-sm">{step.title}</div>
                    <StepBadge status={status} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{step.blurb}</div>
                  {rec?.at && <div className="text-[10px] text-muted-foreground mt-1">{rec.at}{rec.note ? ` · ${rec.note}` : ""}</div>}

                  {/* Proofs */}
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {stepProofs.length === 0
                      ? <EmptyProof label={step.proofLabel} />
                      : stepProofs.map((p) => <ProofCard key={p.id} proof={p} />)}
                  </div>

                  {/* Supplier per-step upload */}
                  {role === "supplier" && !isDisputed && !isComplete && (done || isCurrent) && (
                    <button
                      onClick={() => openUpload(step.key)}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      <Upload size={12} /> Upload proof for this step
                    </button>
                  )}
                </li>
              );
            })}
            {isDisputed && (
              <li className="relative pl-10">
                <span className="absolute left-0 top-1 size-8 rounded-full grid place-items-center border-2 bg-destructive border-destructive text-white">
                  <AlertTriangle size={16} />
                </span>
                <div className="font-semibold text-sm text-destructive">Dispute Opened</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {o.dispute?.issueType} · {o.dispute?.at}
                </div>
                {o.dispute?.description && (
                  <div className="text-xs mt-1 p-2 rounded bg-destructive/5 border border-destructive/20">{o.dispute.description}</div>
                )}
              </li>
            )}
          </ol>
        </div>
      </div>

      {uploadOpen && (
        <UploadProofModal
          stage={uploadStage}
          onClose={() => setUploadOpen(false)}
          onSave={(payload) => {
            addProof(o.id, { ...payload, uploadedBy: s.name });
            setUploadOpen(false);
            toast.success("Proof uploaded");
            pushNotification({
              role: "buyer", kind: "order",
              title: `New proof on ${o.id.toUpperCase()}`,
              body: `${payload.type} — ${payload.fileName}`,
              href: `/orders/${o.id}`,
            });
          }}
        />
      )}
      {confirmOpen && (
        <ConfirmDeliveryModal
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmDelivery}
        />
      )}
      {disputeOpen && (
        <DisputeModal
          onClose={() => setDisputeOpen(false)}
          onSubmit={handleDispute}
        />
      )}
    </AppShell>
  );
}

function OrderNotFound({ orderId }: { orderId: string }) {
  return (
    <AppShell>
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-3xl">Order not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We couldn't find order <span className="font-mono">{orderId}</span> in the demo orders saved on this device.
        </p>
        <Link to="/orders" className="mt-6 inline-flex rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          Back to Orders
        </Link>
      </div>
    </AppShell>
  );
}

// =================== Small UI pieces ===================

function SummaryField({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function ProtBullet({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      {done
        ? <CheckCircle2 size={14} className="text-success shrink-0" />
        : <Circle size={14} className="text-muted-foreground shrink-0" />}
      <span className={done ? "" : "text-muted-foreground"}>{children}</span>
    </li>
  );
}

function StatusBadge({ state }: { state: string }) {
  const map: Record<string, string> = {
    "Released to Supplier": "chip-verified",
    "Disputed": "",
    "Funds Held in Escrow": "chip-gold",
    "Preparing Shipment": "chip-gold",
    "In Transit": "chip-gold",
    "Delivered — Awaiting Confirmation": "chip-primary",
    "Awaiting Supplier Acceptance": "chip-primary",
  };
  const cls = state === "Disputed"
    ? "bg-destructive/10 text-destructive border border-destructive/30"
    : "";
  return <span className={`chip ${map[state] ?? ""} ${cls}`}>{state}</span>;
}

function StepBadge({ status }: { status: "Completed" | "Current" | "Waiting" }) {
  const cls = status === "Completed"
    ? "bg-success/10 text-success border-success/30"
    : status === "Current"
    ? "bg-primary/10 text-primary border-primary/30"
    : "bg-muted text-muted-foreground border-border";
  return <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${cls}`}>{status}</span>;
}

function EmptyProof({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground flex items-center gap-2">
      <ImageIcon size={14} /> Waiting for {label}
    </div>
  );
}

function ProofCard({ proof }: { proof: Proof }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-xs">
      <div className="flex items-center gap-2">
        <div className="size-10 rounded bg-muted grid place-items-center text-muted-foreground shrink-0">
          <ImageIcon size={18} />
        </div>
        <div className="min-w-0">
          <div className="font-semibold truncate">{proof.type}</div>
          <div className="text-muted-foreground truncate">{proof.fileName}</div>
        </div>
      </div>
      <div className="mt-2 text-[10px] text-muted-foreground">
        Uploaded by {proof.uploadedBy} · {proof.at}
      </div>
      {proof.notes && <div className="mt-1 text-[11px]">{proof.notes}</div>}
      <button className="mt-2 w-full text-[11px] font-semibold border rounded py-1 hover:bg-muted">View Proof</button>
    </div>
  );
}

// =================== Action bar ===================

function ActionBar({
  order, role, isDisputed, isComplete,
  onSupplierAdvance, onSupplierUpload, onBuyerConfirm, onBuyerReport,
}: {
  order: DemoOrder;
  role: "buyer" | "supplier" | "admin";
  isDisputed: boolean;
  isComplete: boolean;
  onSupplierAdvance: (to: StageKey) => void;
  onSupplierUpload: () => void;
  onBuyerConfirm: () => void;
  onBuyerReport: () => void;
}) {
  const cur = currentStage(order);
  const next = nextStage(order);

  if (isDisputed) {
    return (
      <div className="rounded-xl border-2 border-destructive/40 bg-destructive/5 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <div className="font-semibold text-destructive flex items-center gap-1.5"><AlertTriangle size={14} /> Dispute in progress</div>
          <div className="text-xs text-muted-foreground">Our safety team is reviewing. You'll be notified when it's resolved.</div>
        </div>
        <Link to="/messages" className="border rounded-md px-4 py-2 text-sm font-semibold bg-card hover:bg-muted flex items-center gap-1.5">
          <MessageSquare size={14} /> Message Supplier
        </Link>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="rounded-xl border-2 border-success/40 bg-success/5 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <div className="font-semibold text-success flex items-center gap-1.5"><CheckCircle2 size={14} /> Order complete</div>
          <div className="text-xs text-muted-foreground">Escrow released. Thank you for using PSG.</div>
        </div>
        <Link to="/messages" className="border rounded-md px-4 py-2 text-sm font-semibold bg-card hover:bg-muted flex items-center gap-1.5">
          <MessageSquare size={14} /> Message Supplier
        </Link>
      </div>
    );
  }

  if (role === "supplier") {
    const nextLabel: Partial<Record<StageKey, string>> = {
      confirmed: "Confirm Order",
      preparing: "Mark as Preparing",
      ready: "Mark as Ready for Pickup",
      transit: "Mark as In Transit",
      delivered: "Mark as Delivered",
    };
    return (
      <div className="rounded-xl border bg-card p-4 grid sm:grid-cols-3 gap-3">
        <button
          onClick={onSupplierUpload}
          className="border rounded-md py-3 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-muted"
        >
          <Upload size={16} /> Upload Proof
        </button>
        {next && nextLabel[next] ? (
          <button
            onClick={() => onSupplierAdvance(next)}
            className="bg-primary text-primary-foreground rounded-md py-3 font-semibold text-sm hover:bg-primary/90"
          >
            {nextLabel[next]}
          </button>
        ) : (
          <div className="grid place-items-center text-xs text-muted-foreground">Waiting for buyer to confirm delivery</div>
        )}
        <Link to="/messages" className="border rounded-md py-3 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-muted">
          <MessageSquare size={16} /> Message Buyer
        </Link>
      </div>
    );
  }

  // Buyer / admin view
  const canConfirm = cur === "delivered";
  return (
    <div className="rounded-xl border bg-card p-4 grid sm:grid-cols-3 gap-3">
      <button
        onClick={onBuyerConfirm}
        disabled={!canConfirm}
        className="bg-success text-success-foreground rounded-md py-3 font-semibold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <CheckCircle2 size={16} /> Confirm Delivery
      </button>
      <button
        onClick={onBuyerReport}
        className="border-2 border-destructive/40 text-destructive rounded-md py-3 font-semibold text-sm hover:bg-destructive/5 flex items-center justify-center gap-2"
      >
        <ShieldAlert size={16} /> Report Problem
      </button>
      <Link
        to="/messages"
        className="border rounded-md py-3 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-muted"
      >
        <MessageSquare size={16} /> Message Supplier
      </Link>
    </div>
  );
}

// =================== Modals ===================

const PROOF_TYPES: ProofType[] = [
  "Packed goods photo", "Packing list", "Delivery receipt",
  "Driver details", "Proof of delivery", "Invoice", "Other",
];

function UploadProofModal({
  stage, onClose, onSave,
}: {
  stage: StageKey;
  onClose: () => void;
  onSave: (p: { stage: StageKey; type: ProofType; fileName: string; notes?: string }) => void;
}) {
  const [type, setType] = useState<ProofType>("Packed goods photo");
  const [notes, setNotes] = useState("");
  const [fileName, setFileName] = useState("");

  const suggested: Record<ProofType, string> = {
    "Packed goods photo": "packed-goods.jpg",
    "Packing list": "packing-list.pdf",
    "Delivery receipt": "delivery-receipt.pdf",
    "Driver details": "driver-details.pdf",
    "Proof of delivery": "proof-of-delivery.jpg",
    "Invoice": "invoice.pdf",
    "Other": "attachment.pdf",
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 grid place-items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-xl max-w-md w-full shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-5 py-3 flex items-center justify-between">
          <div className="font-display text-lg flex items-center gap-2"><Upload size={18} /> Upload Order Proof</div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="text-xs text-muted-foreground">
            Adding to step: <span className="font-semibold text-foreground">{STEPS.find(s => s.key === stage)?.title}</span>
          </div>
          <label className="block">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Proof type</div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ProofType)}
              className="w-full border rounded-md px-3 py-2 bg-card"
            >
              {PROOF_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</div>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context (e.g. Driver Juan Dela Cruz · Plate NCR 4821)"
              className="w-full border rounded-md px-3 py-2"
            />
          </label>
          <div className="rounded-md border-2 border-dashed p-4 text-center bg-muted/30">
            <FileText size={18} className="mx-auto text-muted-foreground" />
            <div className="text-xs text-muted-foreground mt-1">Drop file or click to upload (demo — file not required)</div>
            <input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder={suggested[type]}
              className="mt-2 w-full text-center text-xs border rounded px-2 py-1 bg-card"
            />
          </div>
        </div>
        <div className="border-t px-5 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
          <button
            onClick={() => onSave({ stage, type, fileName: fileName.trim() || suggested[type], notes: notes.trim() || undefined })}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold"
          >
            Save Proof
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeliveryModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 grid place-items-center p-4 animate-fade-in" onClick={onCancel}>
      <div className="bg-card rounded-xl max-w-md w-full p-6 text-center shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="size-14 rounded-full bg-success/15 grid place-items-center mx-auto mb-3">
          <ShieldCheck size={28} className="text-success" />
        </div>
        <h2 className="font-display text-xl">Confirm delivery?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Only confirm if the goods were delivered correctly. This will release escrow to the supplier.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="border-2 rounded-md py-2.5 font-semibold hover:bg-muted">Cancel</button>
          <button onClick={onConfirm} className="bg-success text-success-foreground rounded-md py-2.5 font-semibold hover:opacity-90">
            Confirm and Release Escrow
          </button>
        </div>
      </div>
    </div>
  );
}

const DISPUTE_TYPES = [
  "Item not delivered", "Wrong item", "Missing quantity", "Damaged goods",
  "Fake product", "Late delivery", "Supplier not responding", "Other",
];

function DisputeModal({
  onClose, onSubmit,
}: {
  onClose: () => void;
  onSubmit: (issueType: string, description: string) => void;
}) {
  const [issue, setIssue] = useState(DISPUTE_TYPES[0]);
  const [desc, setDesc] = useState("");
  return (
    <div className="fixed inset-0 bg-black/60 z-50 grid place-items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-xl max-w-md w-full shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-5 py-3 flex items-center justify-between">
          <div className="font-display text-lg text-destructive flex items-center gap-2"><ShieldAlert size={18} /> Report a Problem</div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <p className="text-xs text-muted-foreground">
            Filing a report will freeze escrow while our safety team reviews the issue.
          </p>
          <label className="block">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Issue type</div>
            <select value={issue} onChange={(e) => setIssue(e.target.value)} className="w-full border rounded-md px-3 py-2 bg-card">
              {DISPUTE_TYPES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Description</div>
            <textarea
              rows={4} value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe what went wrong…"
              className="w-full border rounded-md px-3 py-2"
            />
          </label>
          <div className="rounded-md border-2 border-dashed p-3 text-center bg-muted/30 text-xs text-muted-foreground">
            <ImageIcon size={16} className="mx-auto" />
            Upload evidence (demo — attach photos here)
          </div>
        </div>
        <div className="border-t px-5 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
          <button
            onClick={() => onSubmit(issue, desc.trim())}
            className="px-4 py-2 text-sm rounded-md bg-destructive text-destructive-foreground font-semibold"
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Delivery Method Panel ----
import { DELIVERY_METHODS, DELIVERY_METHOD_LIST, type DeliveryMethodKey } from "@/lib/delivery";
import { Truck, MapPin as MapPinIcon } from "lucide-react";

const DEMO_DELIVERY_FOR_ORDER: Record<string, { method: DeliveryMethodKey; extras: Record<string, string> }> = {
  ord_24011: { method: "supplier_owned_logistics", extras: { "Delivery Address": "12 Tomas Morato, QC", "ETA": "Jul 18", "Delivery Fee": "₱1,500", "Driver": "Ronel S.", "Vehicle Plate": "NCP 2214" } },
  ord_24008: { method: "third_party_carrier", extras: { "Carrier": "LBC", "Tracking Number": "LBC123456789", "Tracking Link": "https://lbcexpress.com/track", "ETA": "Jul 16", "Delivery Fee": "₱480" } },
  ord_23994: { method: "pickup_warehouse", extras: { "Pickup Address": "Silang, Cavite Warehouse", "Pickup Contact": "Aling Rosa · +63 917 555 0330", "Available": "Mon–Sat, 8am–5pm" } },
};

function DeliveryMethodPanel({ orderId }: { orderId: string }) {
  const key = DEMO_DELIVERY_FOR_ORDER[orderId]?.method ?? "supplier_owned_logistics";
  const extras = DEMO_DELIVERY_FOR_ORDER[orderId]?.extras ?? {};
  const [selected, setSelected] = useState<DeliveryMethodKey>(key);
  const method = DELIVERY_METHODS[selected];

  return (
    <div className="rounded-xl border bg-card p-5 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="font-display text-xl flex items-center gap-2"><Truck size={18} /> Delivery Method</div>
          <p className="text-xs text-muted-foreground">How this order will reach you.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DELIVERY_METHOD_LIST.map((m) => (
            <button key={m.key} onClick={() => setSelected(m.key)}
              className={`text-xs px-2.5 py-1.5 rounded-md border ${selected === m.key ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>
              {m.short}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 border rounded-md p-3 bg-muted/30 text-sm">
        <div className="font-semibold">{method.label}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{method.description}</div>
      </div>
      {Object.keys(extras).length > 0 && (
        <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
          {Object.entries(extras).map(([k, v]) => (
            <div key={k} className="flex justify-between border rounded-md p-2">
              <span className="text-xs text-muted-foreground">{k}</span>
              <span className="font-medium text-right truncate ml-2">{v}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3">
        <div className="text-[10px] uppercase text-muted-foreground font-semibold mb-1.5">Timeline</div>
        <div className="flex flex-wrap gap-1.5">
          {method.timeline.map((t, i) => (
            <span key={i} className="text-[11px] px-2 py-1 rounded bg-primary/10 text-primary font-semibold flex items-center gap-1">
              <MapPinIcon size={10} /> {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

