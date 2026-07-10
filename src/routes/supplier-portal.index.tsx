import { createFileRoute, Link } from "@tanstack/react-router";
import { useSupplierListings } from "@/lib/supplier-listings";
import { Plus, Upload, MessageSquare, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { orders, rfqs } from "@/lib/mock-data";

export const Route = createFileRoute("/supplier-portal/")({
  component: PortalDashboard,
});

function PortalDashboard() {
  const listings = useSupplierListings();
  const active = listings.filter((l) => l.status === "Active").length;
  const pending = listings.filter((l) => l.status === "Pending Review").length;
  const openOrders = orders.length;
  const quoteReqs = rfqs.length;

  const attention: { icon: React.ReactNode; text: string; to: string; cta: string }[] = [];
  if (quoteReqs > 0) attention.push({ icon: <MessageSquare size={14} className="text-primary" />, text: `${quoteReqs} quote request${quoteReqs === 1 ? "" : "s"} need a reply`, to: "/supplier-portal/quote-requests", cta: "Reply" });
  if (pending > 0) attention.push({ icon: <AlertCircle size={14} className="text-amber-600" />, text: `${pending} listing${pending === 1 ? "" : "s"} pending review`, to: "/supplier-portal/products", cta: "View" });
  if (openOrders > 0) attention.push({ icon: <AlertCircle size={14} className="text-amber-600" />, text: `${openOrders} order${openOrders === 1 ? "" : "s"} awaiting shipment`, to: "/supplier-portal/orders", cta: "Manage" });
  attention.push({ icon: <CheckCircle2 size={14} className="text-success" />, text: "Verification complete", to: "/supplier-portal/verification", cta: "View" });

  return (
    <div className="space-y-8">
      {/* Section 1: 3 action cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <ActionCard
          to="/supplier-portal/products/new"
          icon={<Plus size={22} />}
          title="Add Product"
          desc="Create a listing in under 2 minutes."
          cta="Add Product"
          primary
        />
        <ActionCard
          to="/supplier-portal/products/bulk-upload"
          icon={<Upload size={22} />}
          title="Bulk Upload"
          desc="Paste or upload many products at once."
          cta="Bulk Upload"
        />
        <ActionCard
          to="/supplier-portal/quote-requests"
          icon={<MessageSquare size={22} />}
          title="Quote Requests"
          desc="Buyers waiting for your price."
          cta="View Requests"
        />
      </div>

      {/* Section 2: 4 essential metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI label="Active Listings" value={String(active)} tone="text-success" />
        <KPI label="Pending Review" value={String(pending)} tone="text-amber-600" />
        <KPI label="Quote Requests" value={String(quoteReqs)} />
        <KPI label="Open Orders" value={String(openOrders)} />
      </div>

      {/* Section 3: Needs Attention */}
      <div className="rounded-lg border bg-card p-5">
        <h2 className="font-semibold mb-3">Needs Attention</h2>
        <ul className="divide-y">
          {attention.map((a, i) => (
            <li key={i} className="flex items-center gap-3 py-3">
              <span>{a.icon}</span>
              <div className="flex-1 text-sm">{a.text}</div>
              <Link to={a.to} className="text-xs text-primary font-semibold inline-flex items-center gap-1">
                {a.cta} <ArrowRight size={12} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ActionCard({ to, icon, title, desc, cta, primary }: { to: string; icon: React.ReactNode; title: string; desc: string; cta: string; primary?: boolean }) {
  return (
    <Link
      to={to}
      className={`rounded-lg border p-5 flex flex-col gap-3 transition-colors hover:border-primary/60 ${
        primary ? "bg-primary text-primary-foreground border-primary" : "bg-card"
      }`}
    >
      <div className={primary ? "" : "text-primary"}>{icon}</div>
      <div>
        <div className="font-semibold text-lg">{title}</div>
        <div className={`text-sm mt-1 ${primary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{desc}</div>
      </div>
      <div className={`mt-auto text-sm font-semibold inline-flex items-center gap-1 ${primary ? "" : "text-primary"}`}>
        {cta} <ArrowRight size={14} />
      </div>
    </Link>
  );
}

function KPI({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</div>
      <div className={`font-display text-2xl mt-1 ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Active": "chip-verified",
    "Draft": "",
    "Pending Review": "chip-primary",
    "Needs Changes": "bg-amber-100 text-amber-800",
    "Rejected": "bg-destructive/10 text-destructive",
    "Paused": "bg-muted",
    "Archived": "bg-muted",
  };
  return <span className={`chip ${map[status] ?? ""}`}>{status}</span>;
}
