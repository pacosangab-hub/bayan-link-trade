import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { DEMO_VERIFICATIONS, type DemoVerification, addAudit } from "@/lib/admin/demo";
import { PageHeader, DataTable, Badge, statusTone } from "@/components/admin/AdminShell";
import { Check, X, FileText, Star, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/verification")({
  head: () => ({ meta: [{ title: "Verification — Admin" }] }),
  component: VerificationPage,
});

const TABS = ["Supplier Verification", "Product Documents", "Payout Accounts"] as const;

const DOC_TYPES = [
  "DTI/SEC registration", "BIR registration", "Mayor's permit", "FDA documents",
  "Product certificates", "Business address proof", "Bank account proof",
];

function VerificationPage() {
  const [tab, setTab] = useState<typeof TABS[number]>("Supplier Verification");
  return (
    <>
      <PageHeader title="Verification" subtitle="Approve suppliers, product docs, and payout accounts" />
      <div className="flex gap-1 border-b mb-3 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Supplier Verification" && <SupplierVerification />}
      {tab === "Product Documents" && (
        <div className="rounded-lg border bg-card p-6">
          <div className="text-sm font-semibold mb-3">Accepted document types</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {DOC_TYPES.map((d) => (
              <div key={d} className="rounded bg-muted/60 px-3 py-2 text-sm flex items-center gap-2">
                <FileText size={14} className="text-muted-foreground" /> {d}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">Product documents are reviewed alongside listings under <span className="font-semibold">Listings → Pending Review</span>.</p>
        </div>
      )}
      {tab === "Payout Accounts" && (
        <div className="rounded-lg border-2 border-dashed p-12 text-center text-sm text-muted-foreground">
          No payout accounts pending verification.
        </div>
      )}
    </>
  );
}

function SupplierVerification() {
  function act(v: DemoVerification, next: DemoVerification["status"], msg: string) {
    addAudit({ action: `supplier ${msg.toLowerCase()}`, entityType: "supplier", entityId: v.id, previousStatus: v.status, newStatus: next });
    toast.success(`${v.supplier} · ${msg}`);
  }
  return (
    <DataTable<DemoVerification>
      rows={DEMO_VERIFICATIONS}
      columns={[
        { key: "s", label: "Supplier", render: (r) => <div className="min-w-40"><div className="font-medium">{r.supplier}</div><div className="text-xs text-muted-foreground">{r.location} · {r.businessType}</div></div> },
        { key: "d", label: "Documents", render: (r) => (
          <div className="flex flex-wrap gap-1">
            {r.docsSubmitted.map((d) => <span key={d} className="chip text-[10px]">{d}</span>)}
          </div>
        ) },
        { key: "sb", label: "Submitted", render: (r) => <span className="text-xs text-muted-foreground">{r.submitted}</span> },
        { key: "st", label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
        { key: "act", label: "Actions", render: (r) => (
          <div className="flex gap-1 flex-wrap">
            <button title="Approve" onClick={() => act(r, "Business Verified", "Approved Verification")}
              className="p-1.5 rounded bg-success/10 text-success"><Check size={13} /></button>
            <button title="Request docs" onClick={() => act(r, "Claimed", "Requested more documents")}
              className="p-1.5 rounded border"><FileText size={13} /></button>
            <button title="Reject" onClick={() => act(r, "Rejected", "Rejected")}
              className="p-1.5 rounded bg-destructive/10 text-destructive"><X size={13} /></button>
            <button title="Gold Supplier" onClick={() => act(r, "Gold Supplier", "Marked Gold Supplier")}
              className="p-1.5 rounded border"><Star size={13} className="text-gold" /></button>
            <button title="Escrow Ready" onClick={() => act(r, "Escrow Ready", "Marked Escrow Ready")}
              className="p-1.5 rounded border"><ShieldCheck size={13} className="text-success" /></button>
          </div>
        ) },
      ]}
    />
  );
}
