import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  LayoutDashboard, Users, Factory, Package, MessageSquare, ShoppingBag,
  CreditCard, AlertTriangle, ShieldCheck, ShieldAlert, Search, ChevronDown,
  LogOut, ArrowUpRight, Menu,
} from "lucide-react";
import { signOutLocal, useAuth } from "@/lib/auth-store";
import { supabase } from "@/integrations/supabase/client";
import {
  DEMO_BUYERS, DEMO_SUPPLIERS, DEMO_LISTINGS, DEMO_ORDERS,
  DEMO_PAYMENTS, DEMO_DISPUTES, DEMO_REQUESTS,
} from "@/lib/admin/demo";

const NAV: Array<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/buyers", label: "Buyers", icon: Users },
  { to: "/admin/suppliers", label: "Suppliers", icon: Factory },
  { to: "/admin/listings", label: "Listings", icon: Package },
  { to: "/admin/requests", label: "Quote Requests", icon: MessageSquare },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/payments", label: "Payments", icon: CreditCard },
  { to: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { to: "/admin/verification", label: "Verification", icon: ShieldCheck },
  { to: "/admin/safety", label: "Safety", icon: ShieldAlert },
];


export function AdminShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [sidebar, setSidebar] = useState(false);
  return (
    <div className="min-h-screen bg-muted/30">
      <AdminHeader onToggle={() => setSidebar((v) => !v)} />
      <div className="mx-auto max-w-[1400px] flex gap-4 px-3 py-4">
        <aside
          className={`${sidebar ? "block" : "hidden"} md:block shrink-0 md:sticky md:top-4 md:self-start md:w-56 w-full`}
        >
          <nav className="rounded-lg border bg-card p-2 space-y-0.5">
            {NAV.map((n) => {
              const active = n.exact ? path === n.to : path.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setSidebar(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/75 hover:bg-muted"
                  }`}
                >
                  <Icon size={16} />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

function AdminHeader({ onToggle }: { onToggle: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  return (
    <header className="bg-ink text-white sticky top-0 z-30">
      <div className="mx-auto max-w-[1400px] px-3 py-2.5 flex items-center gap-3">
        <button className="md:hidden text-white/80" onClick={onToggle} aria-label="Menu">
          <Menu size={20} />
        </button>
        <Link to="/admin" className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-gold" />
          <span className="font-display text-lg">Admin Console</span>
        </Link>
        <div className="flex-1 max-w-xl mx-auto hidden md:block">
          <AdminSearch />
        </div>
        <div className="relative">
          <button
            onClick={() => setMenu((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm hover:bg-white/10"
          >
            <span className="size-7 rounded-full bg-gold text-ink grid place-items-center font-bold text-xs">
              {(user?.fullName || "A").slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden sm:inline">{user?.fullName || "Admin"}</span>
            <ChevronDown size={14} />
          </button>
          {menu && (
            <div className="absolute right-0 mt-2 w-56 rounded-md border bg-card text-foreground shadow-lg py-1 text-sm">
              <div className="px-3 py-2 text-xs text-muted-foreground border-b">Admin Account</div>
              <Link to="/admin" className="block px-3 py-2 hover:bg-muted" onClick={() => setMenu(false)}>Admin Profile</Link>
              <Link to="/" className="flex items-center justify-between px-3 py-2 hover:bg-muted" onClick={() => setMenu(false)}>
                Go to Marketplace <ArrowUpRight size={13} />
              </Link>
              <button
                className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-destructive border-t"
                onClick={async () => {
                  try { await supabase.auth.signOut(); } catch { /* ignore */ }
                  signOutLocal();
                  setMenu(false);
                  navigate({ to: "/login" });
                }}
              >
                <LogOut size={13} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="md:hidden px-3 pb-2">
        <AdminSearch />
      </div>
    </header>
  );
}

function AdminSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const query = q.trim().toLowerCase();
  const results = query.length >= 2 ? {
    Buyers: DEMO_BUYERS.filter((b) => b.business.toLowerCase().includes(query) || b.email.toLowerCase().includes(query) || b.phone.includes(query)).slice(0, 4),
    Suppliers: DEMO_SUPPLIERS.filter((s) => s.supplier.toLowerCase().includes(query)).slice(0, 4),
    Orders: DEMO_ORDERS.filter((o) => o.id.toLowerCase().includes(query) || o.product.toLowerCase().includes(query)).slice(0, 4),
    Payments: DEMO_PAYMENTS.filter((p) => p.id.toLowerCase().includes(query) || p.orderId.toLowerCase().includes(query)).slice(0, 4),
    Listings: DEMO_LISTINGS.filter((l) => l.product.toLowerCase().includes(query)).slice(0, 4),
    Disputes: DEMO_DISPUTES.filter((d) => d.id.toLowerCase().includes(query) || d.orderId.toLowerCase().includes(query)).slice(0, 4),
    Requests: DEMO_REQUESTS.filter((r) => r.id.toLowerCase().includes(query) || r.product.toLowerCase().includes(query)).slice(0, 4),
  } : null;
  const hasResults = results && Object.values(results).some((arr) => arr.length > 0);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-md bg-white/10 border border-white/15 px-3 py-1.5">
        <Search size={15} className="text-white/70" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search buyers, suppliers, orders, payments, disputes…"
          className="bg-transparent outline-none placeholder:text-white/50 text-sm flex-1 text-white"
        />
      </div>
      {open && results && (
        <div className="absolute left-0 right-0 mt-2 rounded-md border bg-card text-foreground shadow-lg max-h-[70vh] overflow-y-auto z-40">
          {!hasResults && <div className="p-6 text-center text-sm text-muted-foreground">No results.</div>}
          {(Object.entries(results) as Array<[string, Array<{ id: string; [k: string]: unknown }>]>).map(([group, items]) =>
            items.length === 0 ? null : (
              <div key={group}>
                <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/50 font-semibold">{group}</div>
                {items.map((item) => (
                  <Link
                    key={item.id}
                    to={
                      group === "Buyers" ? "/admin/buyers" :
                      group === "Suppliers" ? "/admin/suppliers" :
                      group === "Orders" ? "/admin/orders" :
                      group === "Payments" ? "/admin/payments" :
                      group === "Listings" ? "/admin/listings" :
                      group === "Disputes" ? "/admin/disputes" :
                      "/admin/requests"
                    }
                    className="block px-3 py-2 text-sm hover:bg-muted"
                  >
                    <div className="font-medium truncate">
                      {String(item.business || item.supplier || item.product || item.id || "")}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {String(item.email || item.location || item.orderId || item.category || item.reason || "")}
                    </div>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ---- Shared UI helpers ----

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div>
        <h1 className="font-display text-2xl">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function StatCard({ label, value, tone, sub }: { label: string; value: string | number; tone?: "warn" | "safe" | "info"; sub?: string }) {
  const toneClass =
    tone === "warn" ? "text-destructive" :
    tone === "safe" ? "text-success" :
    tone === "info" ? "text-primary" : "text-foreground";
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className={`mt-1.5 text-2xl font-display ${toneClass}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export function Badge({ tone, children }: { tone?: "success" | "warn" | "danger" | "info" | "muted"; children: ReactNode }) {
  const cls =
    tone === "success" ? "bg-success/10 text-success" :
    tone === "warn" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" :
    tone === "danger" ? "bg-destructive/10 text-destructive" :
    tone === "info" ? "bg-primary/10 text-primary" :
    "bg-muted text-foreground/70";
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>;
}

export function statusTone(status: string): "success" | "warn" | "danger" | "info" | "muted" {
  const s = status.toLowerCase();
  if (["active", "paid", "released", "completed", "delivered", "resolved release", "in stock", "gold supplier", "escrow ready", "product docs verified", "business verified"].some((k) => s.includes(k))) return "success";
  if (["pending", "awaiting", "review", "processing", "reviewing", "sent", "low stock", "held", "under review"].some((k) => s.includes(k))) return "warn";
  if (["failed", "rejected", "suspended", "flagged", "disputed", "blocked", "out of stock", "critical", "high", "cancelled", "expired"].some((k) => s.includes(k))) return "danger";
  if (["new", "open", "claimed"].some((k) => s.includes(k))) return "info";
  return "muted";
}

export function DataTable<T extends { id: string }>({ columns, rows, empty = "No records found." }: {
  columns: Array<{ key: string; label: string; render: (row: T) => ReactNode; className?: string }>;
  rows: T[];
  empty?: string;
}) {
  if (rows.length === 0) {
    return <div className="rounded-lg border-2 border-dashed p-12 text-center text-sm text-muted-foreground">{empty}</div>;
  }
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`px-3 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold whitespace-nowrap ${c.className || ""}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30">
                {columns.map((c) => (
                  <td key={c.key} className={`px-3 py-2.5 align-middle ${c.className || ""}`}>{c.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-xl bg-card border-l shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-card border-b px-4 py-3 flex items-center justify-between">
          <h2 className="font-display text-lg">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm px-2">Close</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
