import { useState } from "react";
import { X, Send, Paperclip, ShieldCheck } from "lucide-react";
import { createOffer, reviseOffer, computeBreakdown, formatPhp } from "@/lib/offers-store";
import type { CustomRequest, CustomOffer } from "@/lib/offers-store";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
  supplierId: string;
  request?: CustomRequest;
  revisingOffer?: CustomOffer;
  onSent?: (offerId: string) => void;
};

export function SendCustomOfferModal({ open, onClose, supplierId, request, revisingOffer, onSent }: Props) {
  const isRevise = !!revisingOffer;
  const base = revisingOffer;

  const [title, setTitle] = useState(base?.title ?? (request ? `Custom offer — ${request.productName}` : ""));
  const [description, setDescription] = useState(base?.description ?? request?.requirements ?? "");
  const [qty, setQty] = useState(base?.qty ?? request?.qty ?? 100);
  const [unit, setUnit] = useState(base?.unit ?? request?.unit ?? "units");
  const [unitPrice, setUnitPrice] = useState(base?.unitPrice ?? 100);
  const [moq, setMoq] = useState(base?.moq ?? request?.qty ?? 100);
  const [leadTimeDays, setLeadTimeDays] = useState(base?.leadTimeDays ?? 7);
  const [deliveryFee, setDeliveryFee] = useState(base?.deliveryFee ?? 1200);
  const [deliverySchedule, setDeliverySchedule] = useState(base?.deliverySchedule ?? "Single delivery within lead time");
  const [paymentTerms, setPaymentTerms] = useState(base?.paymentTerms ?? "Escrow · 50% upfront, 50% on delivery");
  const [escrowAvailable, setEscrowAvailable] = useState(base?.escrowAvailable ?? true);
  const [validUntil, setValidUntil] = useState(base?.validUntil ?? "7 days from send");
  const [stock, setStock] = useState(base?.stock ?? "In stock");
  const [warranty, setWarranty] = useState(base?.warranty ?? "Free replacement for defects on arrival");
  const [certifications, setCertifications] = useState(base?.certifications ?? "");
  const [notes, setNotes] = useState(base?.notes ?? "");
  const [recurring, setRecurring] = useState(!!base?.recurring?.enabled);
  const [schedule, setSchedule] = useState(base?.recurring?.schedule ?? "Weekly");
  const [duration, setDuration] = useState(base?.recurring?.duration ?? "6 months");
  const [priceLockMonths, setPriceLockMonths] = useState(base?.recurring?.priceLockMonths ?? 6);

  if (!open) return null;

  const totalPrice = Math.round(unitPrice * qty);
  const breakdown = computeBreakdown(unitPrice, qty, deliveryFee);

  function submit() {
    if (!title.trim() || !request) { toast.error("Missing offer title or source request"); return; }
    if (isRevise && base) {
      reviseOffer(base.id, {
        unitPrice, totalPrice, leadTimeDays, deliveryFee, notes, description, qty,
        deliverySchedule, paymentTerms, validUntil, breakdown,
      });
      toast.success(`Revised offer sent as v${base.version + 1}.`);
      onSent?.(base.id);
    } else {
      const off = createOffer(request.id, {
        supplierId, buyerBusiness: request.buyerBusiness,
        productName: request.productName, category: request.category, industry: request.industry,
        title, description, qty, unit, unitPrice, totalPrice,
        moq, leadTimeDays, deliveryFee, deliverySchedule,
        deliveryLocation: request.deliveryLocation, neededBy: request.neededBy,
        paymentTerms, escrowAvailable, validUntil, stock, warranty,
        certifications, notes, attachments: [],
        breakdown,
        recurring: recurring ? { enabled: true, schedule, duration, priceLockMonths } : undefined,
      });
      toast.success("Custom offer sent.", { description: "The buyer can now review, accept, or request changes." });
      onSent?.(off.id);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-lg w-full max-w-3xl max-h-[92vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-card border-b px-5 py-3 flex items-center justify-between z-10">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Supplier Proposal</div>
            <h2 className="font-display text-xl">{isRevise ? `Revise offer (v${(base?.version ?? 1) + 1})` : "Send Custom Offer"}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted"><X size={18} /></button>
        </div>

        <div className="p-5 grid gap-4 text-sm">
          {request && (
            <div className="rounded-md bg-muted/50 p-3 text-xs">
              <div className="font-semibold text-foreground">Buyer request</div>
              <div className="text-muted-foreground mt-1">
                {request.buyerBusiness} · {request.qty} {request.unit} · target {formatPhp(request.budgetPhp)} · deliver to {request.deliveryLocation}
              </div>
            </div>
          )}

          <Field label="Offer title *">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="Custom rice supply offer for 500 kg/month" />
          </Field>
          <Field label="Product / service description">
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </Field>

          <div className="grid sm:grid-cols-4 gap-3">
            <Field label="Final quantity"><input type="number" value={qty} onChange={(e) => setQty(parseInt(e.target.value || "0"))} className="w-full border rounded-md px-3 py-2" /></Field>
            <Field label="Unit"><input value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full border rounded-md px-3 py-2" /></Field>
            <Field label="Unit price (₱)"><input type="number" value={unitPrice} onChange={(e) => setUnitPrice(parseFloat(e.target.value || "0"))} className="w-full border rounded-md px-3 py-2" /></Field>
            <Field label="MOQ"><input type="number" value={moq} onChange={(e) => setMoq(parseInt(e.target.value || "0"))} className="w-full border rounded-md px-3 py-2" /></Field>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Lead time (days)"><input type="number" value={leadTimeDays} onChange={(e) => setLeadTimeDays(parseInt(e.target.value || "0"))} className="w-full border rounded-md px-3 py-2" /></Field>
            <Field label="Delivery fee (₱)"><input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(parseInt(e.target.value || "0"))} className="w-full border rounded-md px-3 py-2" /></Field>
            <Field label="Valid until"><input value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full border rounded-md px-3 py-2" /></Field>
          </div>

          <Field label="Delivery schedule"><input value={deliverySchedule} onChange={(e) => setDeliverySchedule(e.target.value)} className="w-full border rounded-md px-3 py-2" /></Field>
          <Field label="Payment terms"><input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="w-full border rounded-md px-3 py-2" /></Field>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Stock availability"><input value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border rounded-md px-3 py-2" /></Field>
            <Field label="Warranty / replacement"><input value={warranty} onChange={(e) => setWarranty(e.target.value)} className="w-full border rounded-md px-3 py-2" /></Field>
          </div>
          <Field label="Certifications included"><input value={certifications} onChange={(e) => setCertifications(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="FDA, HACCP, NFA, DA-BAFPS" /></Field>
          <Field label="Notes to buyer"><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border rounded-md px-3 py-2" /></Field>

          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={escrowAvailable} onChange={(e) => setEscrowAvailable(e.target.checked)} />
            <ShieldCheck size={12} className="text-success" /> Accept PSG Escrow (recommended)
          </label>

          <div className="rounded-md border p-3 bg-muted/30">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
              Recurring / contract order
            </label>
            {recurring && (
              <div className="grid sm:grid-cols-3 gap-3 mt-3">
                <Field label="Schedule">
                  <select value={schedule} onChange={(e) => setSchedule(e.target.value)} className="w-full border rounded-md px-3 py-2 bg-card">
                    <option>Weekly</option><option>Monthly</option><option>Bi-weekly</option><option>Custom</option>
                  </select>
                </Field>
                <Field label="Contract duration"><input value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full border rounded-md px-3 py-2" /></Field>
                <Field label="Price lock (months)"><input type="number" value={priceLockMonths} onChange={(e) => setPriceLockMonths(parseInt(e.target.value || "0"))} className="w-full border rounded-md px-3 py-2" /></Field>
              </div>
            )}
          </div>

          <button type="button" className="text-xs text-muted-foreground inline-flex items-center gap-1.5 self-start hover:text-primary">
            <Paperclip size={14} /> Attach quotation PDF / product photos / certificates (demo)
          </button>

          <div className="rounded-md border bg-card p-3">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Pricing breakdown</div>
            <Line label={`Product (${qty} × ${formatPhp(unitPrice)})`} value={formatPhp(breakdown.product)} />
            <Line label="Delivery" value={formatPhp(breakdown.delivery)} />
            <Line label="PSG platform fee (3%)" value={formatPhp(breakdown.platform)} muted />
            <Line label="VAT (12%)" value={formatPhp(breakdown.vat)} muted />
            <div className="border-t mt-2 pt-2 flex items-baseline justify-between">
              <span className="text-sm font-semibold">Total payable</span>
              <span className="font-display text-2xl text-primary">{formatPhp(breakdown.total)}</span>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t px-5 py-3 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
          <button onClick={submit} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold inline-flex items-center gap-1.5">
            <Send size={14} /> {isRevise ? "Send Revised Offer" : "Send Custom Offer"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
function Line({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${muted ? "text-xs text-muted-foreground" : "text-sm"}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
