import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DEMO_SUPPLIERS, type DemoSupplier, peso, addAudit } from "@/lib/admin/demo";
import { PageHeader, DataTable, Badge, Drawer, statusTone } from "@/components/admin/AdminShell";
import { AdminNotesPanel, AuditLogPanel } from "@/components/admin/AdminNotes";
import { toast } from "sonner";
import { Star } from "lucide-react";

export const Route = createFileRoute("/admin/suppliers")({
  head: () => ({ meta: [{ title: "Suppliers — Admin" }] }),
  component: SuppliersPage,
});

function SuppliersPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<DemoSupplier | null>(null);

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return DEMO_SUPPLIERS.filter((s) =>
      (filter === "All" || s.status === filter) &&
      (!ql || s.supplier.toLowerCase().includes(ql) || s.location.toLowerCase().includes(ql))
    );
  }, [q, filter]);

  return (
    <>
      <PageHeader title="Suppliers" subtitle={`${DEMO_SUPPLIERS.length} supplier businesses on PSG`} />
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search supplier, location…"
          className="flex-1 min-w-56 border rounded px-3 py-1.5 text-sm bg-card" />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm bg-card">
          {["All", "Active", "Pending Verification", "Needs Documents", "Flagged", "Suspended"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <DataTable<DemoSupplier>
        rows={rows}
        columns={[
          { key: "sup", label: "Supplier", render: (r) => (
            <div className="min-w-48">
              <div className="font-medium">{r.supplier}</div>
              <div className="text-xs text-muted-foreground">{r.location}</div>
            </div>
          ) },
          { key: "type", label: "Type", render: (r) => r.type },
          { key: "ver", label: "Verification", render: (r) => <Badge tone={statusTone(r.verification)}>{r.verification}</Badge> },
          { key: "l", label: "Listings", render: (r) => r.listings },
          { key: "resp", label: "Quote Responses", render: (r) => r.responses },
          { key: "o", label: "Orders", render: (r) => r.orders },
          { key: "s", label: "Sales", render: (r) => <span className="font-medium">{peso(r.sales)}</span> },
          { key: "r", label: "Rating", render: (r) => (
            <span className="inline-flex items-center gap-1"><Star size={12} className="text-gold" /> {r.rating.toFixed(1)}</span>
          ) },
          { key: "st", label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
          { key: "act", label: "Actions", render: (r) => (
            <button onClick={() => setSelected(r)} className="text-xs font-semibold text-primary hover:underline">View</button>
          ) },
        ]}
      />
      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.supplier || ""}>
        {selected && <SupplierDetail sup={selected} onDone={(msg) => { setSelected(null); toast.success(msg); }} />}
      </Drawer>
    </>
  );
}

function SupplierDetail({ sup, onDone }: { sup: DemoSupplier; onDone: (m: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info label="Type" value={sup.type} />
        <Info label="Location" value={sup.location} />
        <Info label="Verification" value={<Badge tone={statusTone(sup.verification)}>{sup.verification}</Badge>} />
        <Info label="Status" value={<Badge tone={statusTone(sup.status)}>{sup.status}</Badge>} />
        <Info label="Listings" value={sup.listings} />
        <Info label="Quote Responses" value={sup.responses} />
        <Info label="Orders" value={sup.orders} />
        <Info label="Sales" value={peso(sup.sales)} />
        <Info label="Rating" value={`${sup.rating.toFixed(1)} / 5`} />
        <Info label="Response Time" value={sup.responseTime} />
        <Info label="Dispute Rate" value={`${sup.disputeRate}%`} />
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { addAudit({ action: "supplier approved", entityType: "supplier", entityId: sup.id, previousStatus: sup.verification, newStatus: "Business Verified" }); onDone("Supplier verified"); }}
          className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground font-semibold">Verify</button>
        <button className="text-xs px-3 py-1.5 rounded border font-semibold">View Listings</button>
        <button className="text-xs px-3 py-1.5 rounded border font-semibold">View Orders</button>
        <button className="text-xs px-3 py-1.5 rounded border font-semibold">Public Preview</button>
        <button onClick={() => { addAudit({ action: "user suspended", entityType: "supplier", entityId: sup.id, previousStatus: sup.status, newStatus: "Suspended" }); onDone("Supplier suspended"); }}
          className="text-xs px-3 py-1.5 rounded bg-destructive text-white font-semibold">Suspend</button>
      </div>
      <AdminNotesPanel relatedType="supplier" relatedId={sup.id} />
      <AuditLogPanel entityType="supplier" entityId={sup.id} />
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
