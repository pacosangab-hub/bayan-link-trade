// Report modal — used from Messages header + Order detail.
import { useState } from "react";
import { X, Flag } from "lucide-react";
import { toast } from "sonner";
import { createReport, REPORT_REASONS, type Report } from "@/lib/demo/safety";
import { pushNotification } from "@/lib/demo/notifications";

export function ReportModal({ open, onClose, target }: {
  open: boolean;
  onClose: () => void;
  target: { type: Report["targetType"]; id: string; label: string };
}) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [note, setNote] = useState("");
  if (!open) return null;
  function submit() {
    createReport({ ...target, targetType: target.type, reason, note });
    pushNotification({
      role: "admin", kind: "dispute",
      title: "New report submitted",
      body: `${reason} · ${target.label}`,
      href: "/admin/safety",
    });
    toast.success("Report submitted", { description: "Our safety team will review it." });
    onClose();
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-lg max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="border-b px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-lg"><Flag size={18} /> Report</div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="text-xs text-muted-foreground">Reporting: <span className="font-semibold text-foreground">{target.label}</span></div>
          <label className="block">
            <div className="text-xs font-semibold text-muted-foreground mb-1">Reason</div>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border rounded-md px-3 py-2 bg-card">
              {REPORT_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="text-xs font-semibold text-muted-foreground mb-1">Details</div>
            <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="What happened?" />
          </label>
        </div>
        <div className="border-t px-5 py-3 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border">Cancel</button>
          <button onClick={submit} className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground font-semibold">Submit report</button>
        </div>
      </div>
    </div>
  );
}
