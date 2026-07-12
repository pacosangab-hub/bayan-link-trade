import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DEMO_LISTINGS, type DemoListing, addAudit } from "@/lib/admin/demo";
import { PageHeader, DataTable, Badge, statusTone } from "@/components/admin/AdminShell";
import { ShieldAlert, Check, X, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/admin/listings")({
  head: () => ({ meta: [{ title: "Listings — Admin" }] }),
  component: ListingsPage,
});

const TABS = ["Pending Review", "Active", "Needs Changes", "Restricted", "Rejected"] as const;

function ListingsPage() {
  const [tab, setTab] = useState<typeof TABS[number]>("Pending Review");
  const rows = useMemo(() => DEMO_LISTINGS.filter((l) => l.status === tab), [tab]);
  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t, DEMO_LISTINGS.filter((l) => l.status === t).length])) as Record<string, number>, []);

  function act(l: DemoListing, next: DemoListing["status"], label: string) {
    addAudit({ action: `listing ${label}`, entityType: "listing", entityId: l.id, previousStatus: l.status, newStatus: next });
    toast.success(`Listing ${label}`);
  }

  return (
    <>
      <PageHeader title="Listings" subtitle="Review supplier product listings" />
      <div className="flex gap-1 border-b mb-3 overflow-x-auto -mx-1 px-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t} <span className="text-xs text-muted-foreground">({counts[t] || 0})</span>
          </button>
        ))}
      </div>

      <DataTable<DemoListing>
        rows={rows}
        empty="No listings in this tab."
        columns={[
          { key: "p", label: "Product", render: (r) => (
            <div className="min-w-48">
              <div className="font-medium flex items-center gap-1.5">
                {r.compliance !== "Standard" && <ShieldAlert size={13} className="text-amber-600" />}
                {r.product}
              </div>
              {r.compliance === "Restricted" && <div className="text-[11px] text-amber-700 dark:text-amber-400">Compliance review required.</div>}
              {r.compliance === "Docs Required" && <div className="text-[11px] text-amber-700 dark:text-amber-400">Certificates required.</div>}
            </div>
          ) },
          { key: "sup", label: "Supplier", render: (r) => <span className="text-sm">{r.supplier}</span> },
          { key: "c", label: "Category", render: (r) => r.category },
          { key: "pr", label: "Price", render: (r) => r.price },
          { key: "s", label: "Stock", render: (r) => <Badge tone={statusTone(r.stock)}>{r.stock}</Badge> },
          { key: "co", label: "Compliance", render: (r) => <Badge tone={r.compliance === "Standard" ? "muted" : "warn"}>{r.compliance}</Badge> },
          { key: "st", label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
          { key: "sub", label: "Submitted", render: (r) => <span className="text-xs text-muted-foreground">{r.submitted}</span> },
          { key: "act", label: "Actions", render: (r) => (
            <div className="flex gap-1">
              <button onClick={() => act(r, "Active", "approved")} title="Approve"
                className="p-1.5 rounded bg-success/10 text-success hover:bg-success/20"><Check size={13} /></button>
              <button onClick={() => act(r, "Needs Changes", "changes requested")} title="Request Changes"
                className="p-1.5 rounded border"><MessageSquare size={13} /></button>
              <button onClick={() => act(r, "Rejected", "rejected")} title="Reject"
                className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20"><X size={13} /></button>
              <button onClick={() => act(r, "Restricted", "product restricted")} title="Mark Restricted"
                className="p-1.5 rounded border"><ShieldAlert size={13} /></button>
            </div>
          ) },
        ]}
      />
    </>
  );
}
