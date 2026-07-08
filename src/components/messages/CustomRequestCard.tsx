// In-chat card rendering a CustomRequest reference.
import { FileText, ShieldCheck, Sparkles } from "lucide-react";
import { useRequest, formatPhp, requestStatusChip } from "@/lib/offers-store";
import type { DemoRole } from "@/lib/demo/session";

export function CustomRequestCard({ requestId, role, onSendOffer, onEdit, onCancel, onDecline }: {
  requestId: string;
  role: DemoRole;
  onSendOffer?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onDecline?: () => void;
}) {
  const req = useRequest(requestId);
  if (!req) {
    return (
      <div className="rounded-lg border-2 border-dashed border-primary/30 bg-card p-3 max-w-sm text-xs text-muted-foreground">
        Custom request no longer available.
      </div>
    );
  }
  return (
    <div className="rounded-lg border-2 border-primary/30 bg-card p-3 max-w-sm shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-[10px] uppercase tracking-widest text-primary font-bold inline-flex items-center gap-1">
          <FileText size={11} /> Custom Quote Request
        </div>
        <span className={`chip ${requestStatusChip(req.status)}`}>{req.status}</span>
      </div>
      <div className="font-semibold text-sm leading-tight">{req.productName}</div>
      <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px]">
        <Field label="Quantity" value={`${req.qty} ${req.unit}`} />
        <Field label="Budget" value={formatPhp(req.budgetPhp)} />
        <Field label="Deliver to" value={req.deliveryLocation} />
        <Field label="Needed by" value={req.neededBy} />
        <Field label="Order type" value={req.recurring} />
        {req.certifications && <Field label="Certifications" value={req.certifications} />}
      </div>
      {req.requirements && (
        <div className="mt-2 text-[11px] text-muted-foreground line-clamp-3">{req.requirements}</div>
      )}
      {req.status === "Converted to Order" && (
        <div className="mt-2 text-[11px] text-success flex items-center gap-1"><ShieldCheck size={11} /> Order created</div>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {role === "supplier" && req.status !== "Converted to Order" && req.status !== "Rejected" && (
          <>
            <button onClick={onSendOffer} className="text-[11px] font-semibold bg-primary text-primary-foreground rounded-md px-2.5 py-1.5 inline-flex items-center gap-1 hover:bg-primary/90">
              <Sparkles size={11} /> Send Custom Offer
            </button>
            <button onClick={onDecline} className="text-[11px] font-semibold border rounded-md px-2.5 py-1.5 hover:bg-muted">Decline</button>
          </>
        )}
        {role === "buyer" && req.status !== "Converted to Order" && (
          <>
            <button onClick={onEdit} className="text-[11px] font-semibold border rounded-md px-2.5 py-1.5 hover:bg-muted">Edit</button>
            <button onClick={onCancel} className="text-[11px] font-semibold border border-destructive/40 text-destructive rounded-md px-2.5 py-1.5 hover:bg-destructive/5">Cancel Request</button>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-muted/60 px-2 py-1">
      <div className="text-[9px] uppercase text-muted-foreground">{label}</div>
      <div className="font-semibold text-[11px] truncate">{value}</div>
    </div>
  );
}
