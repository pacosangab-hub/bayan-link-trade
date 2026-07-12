import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DEMO_BUYERS, type DemoBuyer, peso, addAudit } from "@/lib/admin/demo";
import { PageHeader, DataTable, Badge, Drawer, statusTone } from "@/components/admin/AdminShell";
import { AdminNotesPanel, AuditLogPanel } from "@/components/admin/AdminNotes";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/buyers")({
  head: () => ({ meta: [{ title: "Buyers — Admin" }] }),
  component: BuyersPage,
});

function BuyersPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("All");
  const [selected, setSelected] = useState<DemoBuyer | null>(null);

  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return DEMO_BUYERS.filter((b) =>
      (filter === "All" || b.status === filter) &&
      (!ql || b.business.toLowerCase().includes(ql) || b.contact.toLowerCase().includes(ql) || b.email.toLowerCase().includes(ql))
    );
  }, [q, filter]);

  return (
    <>
      <PageHeader title="Buyers" subtitle={`${DEMO_BUYERS.length} buyer businesses on PSG`} />
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search buyer, contact, email…"
          className="flex-1 min-w-56 border rounded px-3 py-1.5 text-sm bg-card"
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border rounded px-3 py-1.5 text-sm bg-card">
          {["All", "Active", "New", "Inactive", "Flagged", "Suspended"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <DataTable<DemoBuyer>
        rows={rows}
        columns={[
          { key: "business", label: "Buyer Business", render: (r) => (
            <div className="min-w-48">
              <div className="font-medium">{r.business}</div>
              <div className="text-xs text-muted-foreground">{r.email}</div>
            </div>
          ) },
          { key: "contact", label: "Contact", render: (r) => <div><div>{r.contact}</div><div className="text-xs text-muted-foreground">{r.phone}</div></div> },
          { key: "loc", label: "Location", render: (r) => r.location },
          { key: "ind", label: "Industry", render: (r) => r.industry },
          { key: "req", label: "Requests", render: (r) => r.requests },
          { key: "ord", label: "Orders", render: (r) => r.orders },
          { key: "sp", label: "Total Spend", render: (r) => <span className="font-medium">{peso(r.spend)}</span> },
          { key: "act", label: "Last Active", render: (r) => <span className="text-xs text-muted-foreground">{r.lastActive}</span> },
          { key: "st", label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
          { key: "actions", label: "Actions", render: (r) => (
            <button onClick={() => setSelected(r)} className="text-xs font-semibold text-primary hover:underline">View</button>
          ) },
        ]}
      />

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.business || ""}>
        {selected && <BuyerDetail buyer={selected} onSuspend={() => { setSelected(null); toast.success("Buyer suspended"); }} />}
      </Drawer>
    </>
  );
}

function BuyerDetail({ buyer, onSuspend }: { buyer: DemoBuyer; onSuspend: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info label="Contact" value={buyer.contact} />
        <Info label="Status" value={<Badge tone={statusTone(buyer.status)}>{buyer.status}</Badge>} />
        <Info label="Email" value={buyer.email} />
        <Info label="Phone" value={buyer.phone} />
        <Info label="Location" value={buyer.location} />
        <Info label="Industry" value={buyer.industry} />
        <Info label="Quote Requests" value={buyer.requests} />
        <Info label="Orders Completed" value={buyer.orders} />
        <Info label="Total Spend" value={peso(buyer.spend)} />
        <Info label="Disputes Opened" value={buyer.disputes} />
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Preferred Categories</div>
        <div className="flex flex-wrap gap-1.5">
          {buyer.categories.map((c) => <Badge key={c} tone="muted">{c}</Badge>)}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className="text-xs px-3 py-1.5 rounded border font-semibold">View Orders</button>
        <button className="text-xs px-3 py-1.5 rounded border font-semibold">View Requests</button>
        <button className="text-xs px-3 py-1.5 rounded border font-semibold">Message</button>
        <button
          onClick={() => { addAudit({ action: "user suspended", entityType: "buyer", entityId: buyer.id, previousStatus: buyer.status, newStatus: "Suspended" }); onSuspend(); }}
          className="text-xs px-3 py-1.5 rounded bg-destructive text-white font-semibold"
        >
          Suspend
        </button>
      </div>
      <AdminNotesPanel relatedType="buyer" relatedId={buyer.id} />
      <AuditLogPanel entityType="buyer" entityId={buyer.id} />
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
