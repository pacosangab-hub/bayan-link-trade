import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DEMO_ORDERS, type DemoOrder, peso, addAudit } from "@/lib/admin/demo";
import { PageHeader, DataTable, Badge, Drawer, statusTone } from "@/components/admin/AdminShell";
import { AdminNotesPanel, AuditLogPanel } from "@/components/admin/AdminNotes";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({ meta: [{ title: "Orders — Admin" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<DemoOrder | null>(null);
  const statuses = ["All", ...Array.from(new Set(DEMO_ORDERS.map((o) => o.status)))];
  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return DEMO_ORDERS.filter((o) =>
      (status === "All" || o.status === status) &&
      (!ql || o.id.toLowerCase().includes(ql) || o.buyer.toLowerCase().includes(ql) || o.supplier.toLowerCase().includes(ql) || o.product.toLowerCase().includes(ql))
    );
  }, [q, status]);
  return (
    <>
      <PageHeader title="Orders" subtitle="Every transaction on PSG" />
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order, buyer, supplier…"
          className="flex-1 min-w-56 border rounded px-3 py-1.5 text-sm bg-card" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-3 py-1.5 text-sm bg-card">
          {statuses.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <DataTable<DemoOrder>
        rows={rows}
        columns={[
          { key: "id", label: "Order #", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "b", label: "Buyer", render: (r) => r.buyer },
          { key: "s", label: "Supplier", render: (r) => r.supplier },
          { key: "p", label: "Product", render: (r) => <span className="text-sm">{r.product}</span> },
          { key: "a", label: "Amount", render: (r) => <span className="font-medium">{peso(r.amount)}</span> },
          { key: "py", label: "Payment", render: (r) => <Badge tone={statusTone(r.payment)}>{r.payment}</Badge> },
          { key: "st", label: "Order Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
          { key: "e", label: "Escrow", render: (r) => <Badge tone={statusTone(r.escrow)}>{r.escrow}</Badge> },
          { key: "d", label: "Date", render: (r) => <span className="text-xs text-muted-foreground">{r.date}</span> },
          { key: "act", label: "Actions", render: (r) => (
            <button onClick={() => setSelected(r)} className="text-xs font-semibold text-primary hover:underline">View</button>
          ) },
        ]}
      />
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.id || ""}>
        {selected && <OrderDetail order={selected} onDone={(m) => { setSelected(null); toast.success(m); }} />}
      </Drawer>
    </>
  );
}

function OrderDetail({ order, onDone }: { order: DemoOrder; onDone: (m: string) => void }) {
  const fee = Math.round(order.amount * 0.065);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info label="Buyer" value={order.buyer} />
        <Info label="Supplier" value={order.supplier} />
        <Info label="Product" value={order.product} />
        <Info label="Amount" value={peso(order.amount)} />
        <Info label="Platform Fee" value={peso(fee)} />
        <Info label="Escrow" value={<Badge tone={statusTone(order.escrow)}>{order.escrow}</Badge>} />
        <Info label="Order Status" value={<Badge tone={statusTone(order.status)}>{order.status}</Badge>} />
        <Info label="Date" value={order.date} />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Timeline</div>
        <ol className="space-y-1.5 text-sm border-l-2 border-primary/40 pl-3">
          <li>Buyer placed order · {order.date}</li>
          <li>Payment protected in escrow</li>
          <li>Supplier preparing shipment</li>
          {(order.status === "In Transit" || order.status === "Delivered" || order.status === "Completed") && <li>In transit</li>}
          {(order.status === "Delivered" || order.status === "Completed") && <li>Delivered</li>}
          {order.status === "Completed" && <li>Buyer confirmed · Escrow released</li>}
          {order.status === "Disputed" && <li className="text-destructive">Dispute opened</li>}
        </ol>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="text-xs px-3 py-1.5 rounded border font-semibold">View Proof</button>
        <button className="text-xs px-3 py-1.5 rounded border font-semibold">Message Parties</button>
        <button onClick={() => { addAudit({ action: "dispute opened", entityType: "order", entityId: order.id, newStatus: "Disputed" }); onDone("Dispute opened"); }}
          className="text-xs px-3 py-1.5 rounded bg-destructive text-white font-semibold">Open Dispute</button>
      </div>
      <AdminNotesPanel relatedType="order" relatedId={order.id} />
      <AuditLogPanel entityType="order" entityId={order.id} />
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
