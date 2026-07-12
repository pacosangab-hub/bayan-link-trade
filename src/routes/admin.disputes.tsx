import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DEMO_DISPUTES, type DemoDispute, peso, addAudit } from "@/lib/admin/demo";
import { PageHeader, DataTable, Badge, Drawer, statusTone } from "@/components/admin/AdminShell";
import { AdminNotesPanel, AuditLogPanel } from "@/components/admin/AdminNotes";

export const Route = createFileRoute("/admin/disputes")({
  head: () => ({ meta: [{ title: "Disputes — Admin" }] }),
  component: DisputesPage,
});

function DisputesPage() {
  const [selected, setSelected] = useState<DemoDispute | null>(null);
  return (
    <>
      <PageHeader title="Disputes" subtitle="Resolve buyer / supplier problems" />
      <DataTable<DemoDispute>
        rows={DEMO_DISPUTES}
        columns={[
          { key: "id", label: "Dispute", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "o", label: "Order", render: (r) => <span className="font-mono text-xs">{r.orderId}</span> },
          { key: "b", label: "Buyer", render: (r) => r.buyer },
          { key: "s", label: "Supplier", render: (r) => r.supplier },
          { key: "r", label: "Reason", render: (r) => r.reason },
          { key: "a", label: "Amount", render: (r) => peso(r.amount) },
          { key: "st", label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
          { key: "op", label: "Opened", render: (r) => <span className="text-xs text-muted-foreground">{r.opened}</span> },
          { key: "act", label: "Actions", render: (r) => (
            <button onClick={() => setSelected(r)} className="text-xs font-semibold text-primary hover:underline">Resolve</button>
          ) },
        ]}
      />
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.id} · ${selected.reason}` : ""}>
        {selected && <DisputeDetail d={selected} onDone={(m) => { setSelected(null); toast.success(m); }} />}
      </Drawer>
    </>
  );
}

function DisputeDetail({ d, onDone }: { d: DemoDispute; onDone: (m: string) => void }) {
  const [decision, setDecision] = useState("");
  function decide(next: DemoDispute["status"], action: string) {
    addAudit({ action: `dispute resolved · ${action}`, entityType: "dispute", entityId: d.id, previousStatus: d.status, newStatus: next });
    onDone(`Dispute ${action}`);
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info label="Order" value={d.orderId} />
        <Info label="Amount" value={peso(d.amount)} />
        <Info label="Buyer" value={d.buyer} />
        <Info label="Supplier" value={d.supplier} />
        <Info label="Status" value={<Badge tone={statusTone(d.status)}>{d.status}</Badge>} />
        <Info label="Opened" value={d.opened} />
      </div>

      <div className="rounded-lg border bg-card">
        <div className="px-3 py-2 border-b text-xs uppercase tracking-wider text-muted-foreground font-semibold">Buyer Complaint</div>
        <div className="p-3 text-sm">{d.buyerClaim}</div>
      </div>
      <div className="rounded-lg border bg-card">
        <div className="px-3 py-2 border-b text-xs uppercase tracking-wider text-muted-foreground font-semibold">Supplier Response</div>
        <div className="p-3 text-sm text-muted-foreground">{d.supplierResponse || "No response yet."}</div>
      </div>

      <div className="rounded-lg border bg-card p-3">
        <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Admin Decision Notes</label>
        <textarea value={decision} onChange={(e) => setDecision(e.target.value)} rows={3}
          placeholder="Reasoning for decision (recorded to audit log)…"
          className="mt-1 w-full border rounded px-3 py-2 text-sm bg-card" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="text-xs px-3 py-1.5 rounded border font-semibold" onClick={() => toast.success("Requested buyer evidence")}>Request Buyer Evidence</button>
        <button className="text-xs px-3 py-1.5 rounded border font-semibold" onClick={() => toast.success("Requested supplier response")}>Request Supplier Response</button>
        <button className="text-xs px-3 py-1.5 rounded bg-success text-white font-semibold" onClick={() => decide("Resolved Release", "resolved · release")}>Release to Supplier</button>
        <button className="text-xs px-3 py-1.5 rounded bg-destructive text-white font-semibold" onClick={() => decide("Resolved Refund", "resolved · refund")}>Refund Buyer</button>
        <button className="text-xs px-3 py-1.5 rounded border font-semibold" onClick={() => decide("Partial Refund", "partial refund")}>Partial Refund</button>
        <button className="text-xs px-3 py-1.5 rounded border font-semibold" onClick={() => decide("Closed", "closed")}>Close</button>
      </div>

      <AdminNotesPanel relatedType="dispute" relatedId={d.id} />
      <AuditLogPanel entityType="dispute" entityId={d.id} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded bg-muted/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
