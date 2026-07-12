import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { DEMO_SAFETY, type SafetyItem, OFF_PLATFORM_KEYWORDS, addAudit } from "@/lib/admin/demo";
import { PageHeader, DataTable, Badge, statusTone } from "@/components/admin/AdminShell";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin/safety")({
  head: () => ({ meta: [{ title: "Safety — Admin" }] }),
  component: SafetyPage,
});

function SafetyPage() {
  function act(r: SafetyItem, action: string) {
    addAudit({ action, entityType: "safety", entityId: r.id, previousStatus: r.status, newStatus: "Actioned" });
    toast.success(action);
  }
  return (
    <>
      <PageHeader title="Safety" subtitle="Fraud, restricted products, and off-platform risk" />

      <div className="grid gap-3 md:grid-cols-4 mb-4">
        <Metric label="Open items" value={DEMO_SAFETY.filter((r) => r.status === "Open").length} tone="warn" />
        <Metric label="Critical risk" value={DEMO_SAFETY.filter((r) => r.risk === "Critical").length} tone="danger" />
        <Metric label="Off-platform warnings" value={DEMO_SAFETY.filter((r) => r.type === "Off-platform Warning").length} />
        <Metric label="Flagged suppliers" value={DEMO_SAFETY.filter((r) => r.type === "Flagged Supplier").length} />
      </div>

      <DataTable<SafetyItem>
        rows={DEMO_SAFETY}
        columns={[
          { key: "t", label: "Type", render: (r) => <div className="flex items-center gap-1.5"><ShieldAlert size={13} className="text-amber-600" />{r.type}</div> },
          { key: "u", label: "User / Business", render: (r) => r.user },
          { key: "i", label: "Issue", render: (r) => <span className="text-sm">{r.issue}</span> },
          { key: "rel", label: "Related", render: (r) => <span className="text-xs font-mono">{r.related}</span> },
          { key: "risk", label: "Risk", render: (r) => <Badge tone={statusTone(r.risk)}>{r.risk}</Badge> },
          { key: "st", label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
          { key: "act", label: "Actions", render: (r) => (
            <div className="flex gap-1 flex-wrap text-xs">
              <button className="px-2 py-1 rounded border" onClick={() => act(r, "Reviewed")}>Review</button>
              <button className="px-2 py-1 rounded border" onClick={() => act(r, "User warned")}>Warn</button>
              <button className="px-2 py-1 rounded bg-destructive text-white" onClick={() => act(r, "User suspended")}>Suspend</button>
              <button className="px-2 py-1 rounded border" onClick={() => act(r, "Listing removed")}>Remove Listing</button>
              <button className="px-2 py-1 rounded border" onClick={() => act(r, "Payment frozen")}>Freeze Payment</button>
              <button className="px-2 py-1 rounded border text-muted-foreground" onClick={() => act(r, "Dismissed")}>Dismiss</button>
            </div>
          ) },
        ]}
      />

      <div className="mt-6 rounded-lg border bg-card p-4">
        <div className="font-semibold text-sm mb-2">Off-platform payment keywords watched in messages</div>
        <div className="flex flex-wrap gap-1.5">
          {OFF_PLATFORM_KEYWORDS.map((k) => <span key={k} className="chip text-xs">{k}</span>)}
        </div>
      </div>
    </>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "warn" | "danger" }) {
  const cls = tone === "danger" ? "text-destructive" : tone === "warn" ? "text-amber-600" : "text-foreground";
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`mt-1 text-2xl font-display ${cls}`}>{value}</div>
    </div>
  );
}
