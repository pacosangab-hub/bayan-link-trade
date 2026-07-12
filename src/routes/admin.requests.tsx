import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { DEMO_REQUESTS, type DemoRequest } from "@/lib/admin/demo";
import { PageHeader, DataTable, Badge, statusTone } from "@/components/admin/AdminShell";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/requests")({
  head: () => ({ meta: [{ title: "Quote Requests — Admin" }] }),
  component: RequestsPage,
});

const STATUSES = ["All", "Open", "Sent to Suppliers", "Offers Received", "Buyer Reviewing", "Converted to Order", "Expired", "Cancelled"];

function RequestsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const rows = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return DEMO_REQUESTS.filter((r) =>
      (status === "All" || r.status === status) &&
      (!ql || r.id.toLowerCase().includes(ql) || r.buyer.toLowerCase().includes(ql) || r.product.toLowerCase().includes(ql))
    );
  }, [q, status]);
  return (
    <>
      <PageHeader title="Quote Requests" subtitle="Track buyer demand" />
      <div className="flex flex-wrap gap-2 mb-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search request, buyer, product…"
          className="flex-1 min-w-56 border rounded px-3 py-1.5 text-sm bg-card" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-3 py-1.5 text-sm bg-card">
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <DataTable<DemoRequest>
        rows={rows}
        columns={[
          { key: "id", label: "Request ID", render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: "b", label: "Buyer", render: (r) => r.buyer },
          { key: "p", label: "Product Needed", render: (r) => <div className="min-w-40"><div className="font-medium">{r.product}</div><div className="text-xs text-muted-foreground">{r.category}</div></div> },
          { key: "q", label: "Quantity", render: (r) => r.qty },
          { key: "l", label: "Location", render: (r) => r.location },
          { key: "c", label: "Contacted", render: (r) => r.contacted },
          { key: "o", label: "Offers", render: (r) => <span className={r.offers === 0 ? "text-destructive font-semibold" : ""}>{r.offers}</span> },
          { key: "st", label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
          { key: "cr", label: "Created", render: (r) => <span className="text-xs text-muted-foreground">{r.created}</span> },
          { key: "a", label: "Actions", render: (r) => (
            <div className="flex gap-1 text-xs">
              <button className="px-2 py-1 rounded border" onClick={() => toast.success("Viewing request")}>View</button>
              <button className="px-2 py-1 rounded border" onClick={() => toast.success("Matching suppliers…")}>Match</button>
              <button className="px-2 py-1 rounded border" onClick={() => toast.success("Buyer messaged")}>Message</button>
              <button className="px-2 py-1 rounded border text-destructive" onClick={() => toast.success("Request closed")}>Close</button>
            </div>
          ) },
        ]}
      />
    </>
  );
}
