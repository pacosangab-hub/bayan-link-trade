// In-chat card rendering a CustomOffer with role-scoped actions.
import { Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useOffer, formatPhp, offerStatusChip, supplierById } from "@/lib/offers-store";
import type { DemoRole } from "@/lib/demo/session";

export function CustomOfferCard({ offerId, role, onAccept, onRequestChanges, onReject, onRevise, onWithdraw }: {
  offerId: string;
  role: DemoRole;
  onAccept?: () => void;
  onRequestChanges?: () => void;
  onReject?: () => void;
  onRevise?: () => void;
  onWithdraw?: () => void;
}) {
  const offer = useOffer(offerId);
  if (!offer) return null;
  const sup = supplierById(offer.supplierId);
  const done = offer.status === "Accepted" || offer.status === "Converted to Order";
  return (
    <div className="rounded-lg border-2 border-primary/40 bg-card p-3 max-w-md shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[10px] uppercase tracking-widest text-primary font-bold inline-flex items-center gap-1">
          <Sparkles size={11} /> Custom Offer · v{offer.version}
        </div>
        <span className={`chip ${offerStatusChip(offer.status)}`}>{offer.status}</span>
      </div>
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div className="font-semibold text-sm leading-tight">{offer.title}</div>
      </div>
      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-2">
        {sup?.name} {sup?.verified && <ShieldCheck size={10} className="text-success" />}
      </div>
      <div className="text-[11px] text-muted-foreground">{offer.qty} {offer.unit} · deliver {offer.deliverySchedule}</div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
        <Row label="Unit price" value={formatPhp(offer.unitPrice)} />
        <Row label="Subtotal" value={formatPhp(offer.breakdown.product)} />
        <Row label="Delivery fee" value={formatPhp(offer.deliveryFee)} />
        <Row label="PSG fee (3%)" value={formatPhp(offer.breakdown.platform)} />
        <Row label="Lead time" value={`${offer.leadTimeDays} days`} />
        <Row label="Valid until" value={offer.validUntil} />
      </div>
      <div className="mt-2 pt-2 border-t flex items-baseline justify-between">
        <div className="text-[10px] uppercase text-muted-foreground">Total payable</div>
        <div className="font-display text-xl text-primary">{formatPhp(offer.breakdown.total)}</div>
      </div>
      {offer.escrowAvailable && (
        <div className="mt-1 text-[11px] text-success flex items-center gap-1">
          <ShieldCheck size={11} /> Escrow-protected · {offer.paymentTerms}
        </div>
      )}
      {done && (
        <div className="mt-2 text-[11px] text-success flex items-center gap-1">
          <CheckCircle2 size={11} /> {offer.orderId ? `Order ${offer.orderId.toUpperCase()} created` : "Accepted"}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {role === "buyer" && offer.status === "Pending Review" && (
          <>
            <button onClick={onAccept} className="text-[11px] font-semibold bg-primary text-primary-foreground rounded-md px-3 py-1.5 hover:bg-primary/90">Accept Offer</button>
            <button onClick={onRequestChanges} className="text-[11px] font-semibold border rounded-md px-2.5 py-1.5 hover:bg-muted">Request Changes</button>
            <button onClick={onReject} className="text-[11px] font-semibold border border-destructive/40 text-destructive rounded-md px-2.5 py-1.5 hover:bg-destructive/5">Reject</button>
          </>
        )}
        {role === "supplier" && (offer.status === "Pending Review" || offer.status === "Changes Requested") && (
          <>
            <button onClick={onRevise} className="text-[11px] font-semibold border rounded-md px-2.5 py-1.5 hover:bg-muted">Revise Offer</button>
            <button onClick={onWithdraw} className="text-[11px] font-semibold border border-destructive/40 text-destructive rounded-md px-2.5 py-1.5 hover:bg-destructive/5">Withdraw</button>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-muted/60 px-2 py-1">
      <div className="text-[9px] uppercase text-muted-foreground">{label}</div>
      <div className="font-semibold text-[11px]">{value}</div>
    </div>
  );
}
