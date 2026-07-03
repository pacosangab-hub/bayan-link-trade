import { useState } from "react";
import { X, Send } from "lucide-react";
import { requestChanges } from "@/lib/offers-store";
import { toast } from "sonner";

const OPTIONS = ["Price", "Quantity", "Delivery date", "Delivery fee", "Product specification", "Payment terms", "Other"];

export function RequestChangesModal({ open, onClose, offerId }: { open: boolean; onClose: () => void; offerId: string }) {
  const [fields, setFields] = useState<string[]>([]);
  const [note, setNote] = useState("");
  if (!open) return null;

  const toggle = (f: string) => setFields((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]));

  function submit() {
    if (fields.length === 0) { toast.error("Pick at least one item to change"); return; }
    requestChanges(offerId, { fields, note });
    toast.success("Change request sent to supplier.");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-lg w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-5 py-3 flex items-center justify-between">
          <h2 className="font-display text-xl">Request changes</h2>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4 text-sm">
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">What would you like to change?</div>
            <div className="flex flex-wrap gap-2">
              {OPTIONS.map((o) => (
                <button key={o} type="button" onClick={() => toggle(o)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold border ${fields.includes(o) ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted"}`}>
                  {o}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <div className="text-xs font-semibold text-muted-foreground mb-1">Explain the changes you want</div>
            <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="e.g. Bring unit price to ₱42/kg and split delivery weekly." />
          </label>
        </div>
        <div className="border-t px-5 py-3 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
          <button onClick={submit} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold inline-flex items-center gap-1.5">
            <Send size={14} /> Send Change Request
          </button>
        </div>
      </div>
    </div>
  );
}
