import { useState } from "react";
import { toast } from "sonner";
import type { RFQ } from "@/lib/mock-data";
import { appendQuote } from "@/lib/rfq-store";
import { X, Upload } from "lucide-react";

export default function SubmitQuoteModal({ rfq, onClose }: { rfq: RFQ; onClose: () => void }) {
  const [price, setPrice] = useState("");
  const [moq, setMoq] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [deliveryFee, setDeliveryFee] = useState("");
  const [terms, setTerms] = useState("Full escrow");
  const [stock, setStock] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalNum = Number(price) * Number(moq || 0);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      appendQuote(rfq.id, {
        supplierId: "sup_004",
        pricePhp: Number(price) || 0,
        moq: Number(moq) || 0,
        leadTimeDays: Number(leadTime) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        paymentTerms: terms,
        note: message || "Quote submitted via PSG.",
      });
      toast.success("Quote submitted. The buyer can now compare your offer with other suppliers.");
      onClose();
    }, 500);
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-background rounded-lg border shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b sticky top-0 bg-background">
          <div>
            <div className="text-xs uppercase tracking-wider text-primary font-semibold">Submit Quote</div>
            <div className="font-semibold mt-0.5">{rfq.title}</div>
            <div className="text-xs text-muted-foreground">{rfq.buyer} · {rfq.qty}</div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <F label={`Price per ${rfq.unit ?? "unit"}`}>
              <input required type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="input" placeholder="0.00" />
            </F>
            <F label="Minimum order (MOQ)">
              <input required type="number" min="1" value={moq} onChange={(e) => setMoq(e.target.value)} className="input" placeholder="100" />
            </F>
            <F label="Delivery lead time (days)">
              <input required type="number" min="0" value={leadTime} onChange={(e) => setLeadTime(e.target.value)} className="input" placeholder="3" />
            </F>
            <F label="Delivery fee (₱)">
              <input type="number" min="0" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} className="input" placeholder="0" />
            </F>
            <F label="Payment terms">
              <select value={terms} onChange={(e) => setTerms(e.target.value)} className="input">
                <option>Full escrow</option>
                <option>50% escrow / 50% on delivery</option>
                <option>30% escrow / 70% on delivery</option>
                <option>Net 15</option>
                <option>Net 30</option>
              </select>
            </F>
            <F label="Available stock">
              <input value={stock} onChange={(e) => setStock(e.target.value)} className="input" placeholder="e.g. 2,000 kg" />
            </F>
          </div>

          <F label="Message to buyer">
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input min-h-[90px]" placeholder="Highlight lead time, certifications, sample availability…" />
          </F>

          <F label="Product certificate / photo">
            <div className="border-2 border-dashed rounded-md py-6 grid place-items-center text-sm text-muted-foreground">
              <Upload size={18} className="mb-1" />
              Drop file or click to upload (placeholder)
            </div>
          </F>

          <div className="rounded-md bg-muted p-3 text-sm flex items-center justify-between">
            <span className="text-muted-foreground">Estimated total</span>
            <span className="font-semibold">₱{Number.isFinite(totalNum) ? totalNum.toLocaleString("en-PH") : 0}</span>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t">
            <button type="button" onClick={onClose} className="border rounded-md px-4 py-2 text-sm font-semibold">Cancel</button>
            <button type="submit" disabled={submitting} className="bg-primary text-primary-foreground rounded-md px-5 py-2 text-sm font-semibold disabled:opacity-60">
              {submitting ? "Submitting…" : "Submit Quote"}
            </button>
          </div>
        </form>
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-input);border-radius:.5rem;padding:.55rem .7rem;background:var(--color-background);font-size:.875rem}.input:focus{outline:2px solid var(--color-primary);outline-offset:0}`}</style>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold mb-1">{label}</div>
      {children}
    </label>
  );
}
