import { createFileRoute, Link } from "@tanstack/react-router";
import { useSupplierListings } from "@/lib/supplier-listings";
import { Package, FileEdit, Clock, ShoppingBag, MessageSquare, ShieldCheck, Plus, Upload } from "lucide-react";
import { orders, rfqs } from "@/lib/mock-data";

export const Route = createFileRoute("/supplier-portal/")({
  component: PortalDashboard,
});

function PortalDashboard() {
  const listings = useSupplierListings();
  const total = listings.length;
  const active = listings.filter((l) => l.status === "Active").length;
  const draft = listings.filter((l) => l.status === "Draft").length;
  const pending = listings.filter((l) => l.status === "Pending Review").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Link to="/supplier-portal/products/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-md font-semibold text-sm">
          <Plus size={16} /> Add New Product
        </Link>
        <Link to="/supplier-portal/products/bulk-upload" className="inline-flex items-center gap-2 border bg-card px-4 py-2.5 rounded-md font-semibold text-sm">
          <Upload size={16} /> Bulk Upload Products
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPI icon={<Package size={18} />} label="Total products" value={String(total)} />
        <KPI icon={<ShieldCheck size={18} />} label="Active" value={String(active)} tone="text-success" />
        <KPI icon={<FileEdit size={18} />} label="Drafts" value={String(draft)} />
        <KPI icon={<Clock size={18} />} label="Pending review" value={String(pending)} tone="text-amber-600" />
        <KPI icon={<ShoppingBag size={18} />} label="Orders received" value={String(orders.length)} />
        <KPI icon={<MessageSquare size={18} />} label="Quote requests" value={String(rfqs.length)} />
        <KPI icon={<ShieldCheck size={18} />} label="Verification" value="Verified" tone="text-success" />
      </div>

      <div className="rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Recent listings</h2>
          <Link to="/supplier-portal/products" className="text-xs text-primary font-semibold">View all →</Link>
        </div>
        <div className="divide-y">
          {listings.slice(0, 5).map((l) => (
            <div key={l.id} className="flex items-center gap-3 py-3">
              <img src={l.images[0]} alt="" className="size-10 rounded object-cover bg-muted" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{l.name}</div>
                <div className="text-xs text-muted-foreground truncate">{l.category} · {l.unit}</div>
              </div>
              <StatusChip status={l.status} />
            </div>
          ))}
          {listings.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">No listings yet. Add your first product.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between text-muted-foreground">
        <div className="text-xs uppercase tracking-wider font-semibold">{label}</div>
        <div className="text-primary">{icon}</div>
      </div>
      <div className={`font-display text-2xl mt-2 ${tone ?? ""}`}>{value}</div>
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
