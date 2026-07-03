import { Link } from "@tanstack/react-router";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { formatPhp, offerStatusChip, type CustomOffer } from "@/lib/offers-store";

export function OfferChatCard({ offer }: { offer: CustomOffer }) {
  return (
    <div className="rounded-lg border-2 border-primary/30 bg-card p-3 max-w-sm shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Custom Offer · v{offer.version}</div>
        <span className={`chip ${offerStatusChip(offer.status)}`}>{offer.status}</span>
      </div>
      <div className="font-semibold text-sm leading-tight">{offer.title}</div>
      <div className="text-xs text-muted-foreground mt-1">{offer.qty} {offer.unit} · deliver {offer.deliverySchedule}</div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-muted/60 px-2 py-1.5">
          <div className="text-[10px] uppercase text-muted-foreground">Unit price</div>
          <div className="font-semibold">{formatPhp(offer.unitPrice)}</div>
        </div>
        <div className="rounded bg-muted/60 px-2 py-1.5">
          <div className="text-[10px] uppercase text-muted-foreground">Total payable</div>
          <div className="font-semibold text-primary">{formatPhp(offer.breakdown.total)}</div>
        </div>
      </div>
      {offer.escrowAvailable && (
        <div className="mt-2 text-[11px] text-success flex items-center gap-1">
          <ShieldCheck size={12} /> Escrow-protected
        </div>
      )}
      <Link to="/offers/$id" params={{ id: offer.id }} className="mt-3 w-full text-center bg-primary text-primary-foreground text-xs font-semibold rounded-md py-2 flex items-center justify-center gap-1.5 hover:bg-primary/90">
        View offer <ArrowRight size={12} />
      </Link>
    </div>
  );
}
