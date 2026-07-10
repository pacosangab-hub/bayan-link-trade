import { createFileRoute, Link } from "@tanstack/react-router";
import { useSupplierListings } from "@/lib/supplier-listings";
import { Plus, Upload, Package, MessageSquare, ShieldCheck, Clock, ShoppingBag, ArrowRight, CheckCircle2 } from "lucide-react";
import { orders, rfqs } from "@/lib/mock-data";

export const Route = createFileRoute("/supplier-portal/")({
  component: PortalDashboard,
});

function PortalDashboard() {
  const listings = useSupplierListings();
  const active = listings.filter((l) => l.status === "Active").length;
  const pending = listings.filter((l) => l.status === "Pending Review").length;

  return (
    <div className="space-y-6">
      {/* 4 main actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ActionCard
          to="/supplier-portal/products/new"
          icon={<Plus size={22} />}
          title="Add Product"
          desc="Create a new listing in under 2 minutes."
          primary
        />
        <ActionCard
          to="/supplier-portal/products/bulk-upload"
          icon={<Upload size={22} />}
          title="Bulk Upload"
          desc="Paste a list or upload CSV."
        />
        <ActionCard
          to="/supplier-portal/products"
          icon={<Package size={22} />}
          title="My Listings"
          desc={`${listings.length} listing${listings.length === 1 ? "" : "s"}`}
        />
        <ActionCard
          to="/supplier-portal/quote-requests"
          icon={<MessageSquare size={22} />}
          title="Quote Requests"
          desc={`${rfqs.length} pending`}
        />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI icon={<ShieldCheck size={16} />} label="Active listings" value={String(active)} tone="text-success" />
        <KPI icon={<Clock size={16} />} label="Pending review" value={String(pending)} tone="text-amber-600" />
        <KPI icon={<MessageSquare size={16} />} label="Quote requests" value={String(rfqs.length)} />
        <KPI icon={<ShoppingBag size={16} />} label="Orders" value={String(orders.length)} />
        <KPI icon={<ShieldCheck size={16} />} label="Verification" value="Verified" tone="text-success" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent listings */}
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Recent listings</h2>
            <Link to="/supplier-portal/products" className="text-xs text-primary font-semibold inline-flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y">
            {listings.slice(0, 5).map((l) => (
              <div key={l.id} className="flex items-center gap-3 py-3">
                <img src={l.images[0]} alt="" className="size-10 rounded object-cover bg-muted" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate text-sm">{l.name}</div>
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

        {/* Recent activity */}
        <div className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold mb-3">Recent activity</h2>
          <ul className="space-y-3 text-sm">
            <Activity icon={<MessageSquare size={14} />} text="New quote request from Sunrise Hotel Group" time="2h ago" />
            <Activity icon={<CheckCircle2 size={14} className="text-success" />} text="Premium Well-Milled Rice 50kg Sack approved" time="Yesterday" />
            <Activity icon={<ShoppingBag size={14} />} text="Order ORD_24011 created — ₱48,500" time="2 days ago" />
            <Activity icon={<CheckCircle2 size={14} className="text-success" />} text="Custom offer accepted by Bakery Central" time="3 days ago" />
          </ul>
        </div>
      </div>
    </div>
  );
}

function ActionCard({ to, icon, title, desc, primary }: { to: string; icon: React.ReactNode; title: string; desc: string; primary?: boolean }) {
  return (
    <Link
      to={to}
      className={`rounded-lg border p-4 flex flex-col gap-2 transition-colors hover:border-primary/60 ${
        primary ? "bg-primary text-primary-foreground border-primary" : "bg-card"
      }`}
    >
      <div className={primary ? "" : "text-primary"}>{icon}</div>
      <div className="font-semibold">{title}</div>
      <div className={`text-xs ${primary ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{desc}</div>
    </Link>
  );
}

function KPI({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between text-muted-foreground">
        <div className="text-[10px] uppercase tracking-wider font-semibold">{label}</div>
        <div className="text-primary">{icon}</div>
      </div>
      <div className={`font-display text-xl mt-1 ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

function Activity({ icon, text, time }: { icon: React.ReactNode; text: string; time: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div>{text}</div>
        <div className="text-xs text-muted-foreground">{time}</div>
      </div>
    </li>
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
