import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DEMO_PAYMENTS, type DemoPayment, peso, addAudit } from "@/lib/admin/demo";
import { PageHeader, DataTable, Badge, statusTone, Drawer } from "@/components/admin/AdminShell";
import { AdminNotesPanel, AuditLogPanel } from "@/components/admin/AdminNotes";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({ meta: [{ title: "Payments — Admin" }] }),
  component: PaymentsPage,
});

function canRelease(p: DemoPayment): { ok: boolean; reason?: string } {
  if (p.disputed) return { ok: false, reason: "Order is disputed" };
  if (!p.buyerConfirmed) return { ok: false, reason: "Buyer has not confirmed delivery" };
  if (!p.supplierVerified) return { ok: false, reason: "Supplier payout account not verified" };
  return { ok: true };
}

function PaymentsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<DemoPayment | null>(null);
  const statuses = ["All", "Awaiting Payment", "Paid", "Refunded", "Cancelled"];
  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return DEMO_PAYMENTS.filter((p) =>
      (status === "All" || p.paymentStatus === status) &&
      (!ql || p.id.toLowerCase().includes(ql) || p.orderId.toLowerCase().includes(ql) || p.buyer.toLowerCase().includes(ql) || p.supplier.toLowerCase().includes(ql))
    );
  }, [q, status]);

  return (
    <>
      <PageHeader title="Payments" subtitle="Protected payments, fees, and supplier payouts" />
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search payment, order, party…"
          className="flex-1 min-w-56 border rounded px-3 py-1.5 text-sm bg-card" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-3 py-1.5 text-sm bg-card">
          {statuses.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <DataTable<DemoPayment>
        rows={rows}
        columns={[
          { key: "id", label: "Payment ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "o", label: "Order", render: (r) => <span className="font-mono text-xs">{r.orderId}</span> },
          { key: "b", label: "Buyer", render: (r) => r.buyer },
          { key: "s", label: "Supplier", render: (r) => r.supplier },
          { key: "a", label: "Total", render: (r) => <span className="font-medium">{peso(r.amount)}</span> },
          { key: "f", label: "Fee", render: (r) => peso(r.fee) },
          { key: "p", label: "Payout", render: (r) => peso(r.payout) },
          { key: "ps", label: "Payment", render: (r) => <Badge tone={statusTone(r.paymentStatus)}>{r.paymentStatus}</Badge> },
          { key: "e", label: "Escrow", render: (r) => <Badge tone={statusTone(r.escrow)}>{r.escrow}</Badge> },
          { key: "po", label: "Payout Status", render: (r) => <Badge tone={statusTone(r.payoutStatus)}>{r.payoutStatus}</Badge> },
          { key: "act", label: "Actions", render: (r) => (
            <button onClick={() => setSelected(r)} className="text-xs font-semibold text-primary hover:underline">Manage</button>
          ) },
        ]}
      />
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.id || ""}>
        {selected && <PaymentDetail p={selected} onDone={(m) => { setSelected(null); toast.success(m); }} />}
      </Drawer>
    </>
  );
}

function PaymentDetail({ p, onDone }: { p: DemoPayment; onDone: (m: string) => void }) {
  const gate = canRelease(p);
  const [ref, setRef] = useState("");
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info label="Order" value={p.orderId} />
        <Info label="Buyer" value={p.buyer} />
        <Info label="Supplier" value={p.supplier} />
        <Info label="Total" value={peso(p.amount)} />
        <Info label="Platform Fee" value={peso(p.fee)} />
        <Info label="Supplier Payout" value={peso(p.payout)} />
        <Info label="Payment" value={<Badge tone={statusTone(p.paymentStatus)}>{p.paymentStatus}</Badge>} />
        <Info label="Escrow" value={<Badge tone={statusTone(p.escrow)}>{p.escrow}</Badge>} />
        <Info label="Payout" value={<Badge tone={statusTone(p.payoutStatus)}>{p.payoutStatus}</Badge>} />
      </div>

      {!gate.ok && (
        <div className="rounded-md bg-amber-500/10 border border-amber-500/30 p-3 flex gap-2 text-sm">
          <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-amber-800 dark:text-amber-300">Payout release blocked</div>
            <div className="text-amber-800/80 dark:text-amber-300/80">{gate.reason}</div>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Payout Reference</label>
        <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. bank ref #, transaction ID"
          className="mt-1 w-full border rounded px-3 py-1.5 text-sm bg-card" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          disabled={!gate.ok}
          onClick={() => { addAudit({ action: "payout released", entityType: "payment", entityId: p.id, previousStatus: p.payoutStatus, newStatus: "Released" }); onDone("Payout released"); }}
          className="text-xs px-3 py-1.5 rounded bg-success text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Release Payout
        </button>
        <button
          onClick={() => { addAudit({ action: "payout frozen", entityType: "payment", entityId: p.id, previousStatus: p.payoutStatus, newStatus: "Blocked" }); onDone("Payout frozen"); }}
          className="text-xs px-3 py-1.5 rounded border font-semibold"
        >
          Freeze Payout
        </button>
        <button
          onClick={() => { addAudit({ action: "buyer refunded", entityType: "payment", entityId: p.id, previousStatus: p.paymentStatus, newStatus: "Refunded" }); onDone("Buyer refunded"); }}
          className="text-xs px-3 py-1.5 rounded bg-destructive text-white font-semibold"
        >
          Refund Buyer
        </button>
      </div>

      <AdminNotesPanel relatedType="payment" relatedId={p.id} />
      <AuditLogPanel entityType="payment" entityId={p.id} />
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
