import { X, ShieldCheck } from "lucide-react";
import { supplierById, formatPhp } from "@/lib/mock-data";

export default function ChooseSupplierModal({
  supplierId,
  pricePhp,
  onCancel,
  onConfirm,
}: {
  supplierId: string;
  pricePhp: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const s = supplierById(supplierId);
  return (
    <div className="fixed inset-0 z-[100] bg-black/50 grid place-items-center p-4" onClick={onCancel}>
      <div className="bg-background rounded-lg border shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b">
          <div className="font-semibold text-lg">Choose this supplier?</div>
          <button onClick={onCancel} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-md bg-muted/60 border">
            <div className="size-11 rounded-md bg-gradient-to-br from-primary to-gold grid place-items-center text-white font-display text-lg">
              {s.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="font-semibold flex items-center gap-1.5 truncate">{s.name} {s.verified && <ShieldCheck size={14} className="text-success" />}</div>
              <div className="text-xs text-muted-foreground">{s.location} · {formatPhp(pricePhp)}/unit</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            You will move this RFQ into order creation. Payment can be protected through PSG Escrow — funds are only released once you confirm delivery.
          </p>
        </div>
        <div className="p-5 pt-0 flex gap-2 justify-end">
          <button onClick={onCancel} className="border rounded-md px-4 py-2 text-sm font-semibold">Cancel</button>
          <button onClick={onConfirm} className="bg-primary text-primary-foreground rounded-md px-5 py-2 text-sm font-semibold">Continue to Order</button>
        </div>
      </div>
    </div>
  );
}
