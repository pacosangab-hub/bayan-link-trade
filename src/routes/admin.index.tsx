import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MARKETPLACE_SNAPSHOT, MARKETPLACE_HEALTH, RECENT_ACTIVITY,
  DEMO_LISTINGS, DEMO_DISPUTES, DEMO_VERIFICATIONS, DEMO_PAYMENTS, DEMO_SAFETY,
  peso,
} from "@/lib/admin/demo";
import { PageHeader, StatCard } from "@/components/admin/AdminShell";
import {
  ShieldCheck, Package, AlertTriangle, CreditCard, MessageSquare, Flag,
  ArrowRight, ShoppingBag, Users, Factory, TrendingUp,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard — PSG" }] }),
  component: AdminDashboard,
});

const ICONS: Record<string, typeof ShoppingBag> = {
  request: MessageSquare, offer: Package, accept: ShoppingBag, order: ShoppingBag,
  escrow: CreditCard, proof: Package, confirm: ShieldCheck, dispute: AlertTriangle,
  verify: ShieldCheck, listing: Package,
};

function AdminDashboard() {
  const s = MARKETPLACE_SNAPSHOT;
  const h = MARKETPLACE_HEALTH;
  const pendingVerification = DEMO_VERIFICATIONS.filter((v) => v.status === "Claimed").length;
  const pendingListings = DEMO_LISTINGS.filter((l) => l.status === "Pending Review").length;
  const openDisputes = DEMO_DISPUTES.filter((d) => !d.status.startsWith("Resolved") && d.status !== "Closed").length;
  const pendingPayouts = DEMO_PAYMENTS.filter((p) => p.payoutStatus === "Pending Release").length;
  const openSafety = DEMO_SAFETY.filter((r) => r.status === "Open").length;
  const restricted = DEMO_LISTINGS.filter((l) => l.compliance === "Restricted" && l.status === "Pending Review").length;

  return (
    <>
      <PageHeader
        title="Marketplace Dashboard"
        subtitle="What's happening on PSG today"
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Buyers" value={s.buyers} />
        <StatCard label="Total Suppliers" value={s.suppliers} />
        <StatCard label="Active Listings" value={s.activeListings} />
        <StatCard label="Quote Requests" value={s.quoteRequests} tone="info" />
        <StatCard label="Open Orders" value={s.openOrders} tone="info" />
        <StatCard label="GMV" value={peso(s.gmv)} tone="safe" />
        <StatCard label="Platform Fees" value={peso(s.fees)} tone="safe" />
        <StatCard label="Disputes" value={s.disputes} tone="warn" />
      </section>

      <section className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* Needs Action */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg">Needs Admin Action</h2>
              <p className="text-xs text-muted-foreground">Urgent tasks only</p>
            </div>
            <Flag className="text-destructive" size={18} />
          </div>
          <div className="divide-y">
            <ActionRow
              icon={ShieldCheck}
              text={`${pendingVerification} suppliers pending verification`}
              action="Review Supplier"
              to="/admin/verification"
            />
            <ActionRow
              icon={Package}
              text={`${pendingListings} listings pending review`}
              action="Review Listing"
              to="/admin/listings"
            />
            <ActionRow
              icon={AlertTriangle}
              text={`${openDisputes} disputes need decision`}
              action="Resolve Dispute"
              to="/admin/disputes"
              tone="danger"
            />
            <ActionRow
              icon={CreditCard}
              text={`${pendingPayouts} payments pending release`}
              action="Check Payment"
              to="/admin/payments"
            />
            <ActionRow
              icon={MessageSquare}
              text={`${openSafety} reported / flagged items`}
              action="View Report"
              to="/admin/safety"
              tone="warn"
            />
            <ActionRow
              icon={Flag}
              text={`${restricted} restricted products need review`}
              action="Review Listing"
              to="/admin/listings"
              tone="warn"
            />
          </div>
        </div>

        {/* Health */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg">Marketplace Health</h2>
              <p className="text-xs text-muted-foreground">Key rates</p>
            </div>
            <TrendingUp size={18} className="text-primary" />
          </div>
          <div className="divide-y">
            <HealthRow label="Buyer / Supplier Ratio" value={h.buyerSupplierRatio} />
            <HealthRow label="Quote Response Rate" value={`${h.quoteResponseRate}%`} />
            <HealthRow label="Offer Acceptance Rate" value={`${h.offerAcceptanceRate}%`} />
            <HealthRow label="Order Completion Rate" value={`${h.orderCompletionRate}%`} tone="safe" />
            <HealthRow label="Dispute Rate" value={`${h.disputeRate}%`} tone="warn" />
            <HealthRow label="Avg Supplier Response" value={h.avgResponseTime} />
          </div>
        </div>
      </section>

      <section className="mt-5 rounded-lg border bg-card overflow-hidden">
        <div className="border-b px-4 py-3">
          <h2 className="font-display text-lg">Recent Activity</h2>
          <p className="text-xs text-muted-foreground">Last 10 marketplace events</p>
        </div>
        <ul className="divide-y">
          {RECENT_ACTIVITY.map((a, i) => {
            const Icon = ICONS[a.icon] || Package;
            return (
              <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <div className="size-7 rounded-full bg-primary/10 text-primary grid place-items-center shrink-0">
                  <Icon size={14} />
                </div>
                <span className="flex-1">{a.text}</span>
                <span className="text-xs text-muted-foreground shrink-0">{a.when}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-5 grid grid-cols-3 gap-3">
        <ShortcutCard to="/admin/buyers" icon={Users} label="Buyers" count={s.buyers} />
        <ShortcutCard to="/admin/suppliers" icon={Factory} label="Suppliers" count={s.suppliers} />
        <ShortcutCard to="/admin/orders" icon={ShoppingBag} label="Orders" count={s.openOrders} />
      </section>
    </>
  );
}

function ActionRow({ icon: Icon, text, action, to, tone }: { icon: typeof ShieldCheck; text: string; action: string; to: string; tone?: "warn" | "danger" }) {
  const c = tone === "danger" ? "text-destructive" : tone === "warn" ? "text-amber-600" : "text-primary";
  return (
    <div className="flex items-center gap-3 px-4 py-3 text-sm">
      <Icon size={16} className={c} />
      <span className="flex-1">{text}</span>
      <Link to={to} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
        {action} <ArrowRight size={12} />
      </Link>
    </div>
  );
}

function HealthRow({ label, value, tone }: { label: string; value: string; tone?: "safe" | "warn" }) {
  const c = tone === "safe" ? "text-success" : tone === "warn" ? "text-destructive" : "text-foreground";
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold ${c}`}>{value}</span>
    </div>
  );
}

function ShortcutCard({ to, icon: Icon, label, count }: { to: string; icon: typeof Users; label: string; count: number }) {
  return (
    <Link to={to} className="rounded-lg border bg-card p-4 hover:border-primary transition-colors flex items-center gap-3">
      <div className="size-10 rounded-md bg-primary/10 text-primary grid place-items-center">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-display text-xl">{count}</div>
      </div>
    </Link>
  );
}
