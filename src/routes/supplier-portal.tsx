import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Component, type ReactNode } from "react";
import { ShieldCheck, Plus, MessageSquare, Eye } from "lucide-react";

import { RequireAuth } from "@/components/auth/RequireAuth";

export const Route = createFileRoute("/supplier-portal")({
  head: () => ({ meta: [{ title: "Supplier Portal — PSG" }] }),
  component: () => (
    <RequireAuth roles={["supplier", "admin"]}>
      <SupplierPortalLayout />
    </RequireAuth>
  ),
});

const tabs = [
  { to: "/supplier-portal", label: "Dashboard", exact: true },
  { to: "/supplier-portal/products", label: "Listings" },
  { to: "/supplier-portal/inventory", label: "Inventory" },
  { to: "/supplier-portal/quote-requests", label: "Buyer Requests" },
  { to: "/supplier-portal/orders", label: "Orders" },
  { to: "/supplier-portal/preview", label: "Public Preview" },
];

const VERIFIED = true;

function SupplierPortalLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Supplier</div>
              <h1 className="font-display text-3xl">Supplier Portal</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage your products, sales, buyer requests, orders, and public profile.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">Bulacan Grain & Rice Mills Inc.</span>
                <span className="chip chip-verified">Verified Supplier</span>
                <span className="chip chip-gold">Gold Supplier</span>
                <span className="text-muted-foreground">· Malolos, Bulacan</span>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-xs font-semibold">
              <ShieldCheck size={14} className={VERIFIED ? "text-success" : "text-amber-600"} />
              Verification: {VERIFIED ? "Complete" : "Needs documents"}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/supplier-portal/products/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold">
              <Plus size={14} /> Add Product
            </Link>
            <Link to="/supplier-portal/quote-requests" className="inline-flex items-center gap-2 border bg-card px-4 py-2 rounded-md text-sm font-semibold">
              <MessageSquare size={14} /> View Quote Requests
            </Link>
            <Link to="/supplier-portal/preview" className="inline-flex items-center gap-2 border bg-card px-4 py-2 rounded-md text-sm font-semibold">
              <Eye size={14} /> Preview Public Profile
            </Link>
          </div>

          <nav className="mt-4 flex gap-1 overflow-x-auto text-sm -mb-px">
            {tabs.map((t) => {
              const active = t.exact ? path === t.to : path.startsWith(t.to);
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={`px-3 py-2.5 whitespace-nowrap font-medium border-b-2 transition-colors ${
                    active ? "border-primary text-primary" : "border-transparent text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
    </AppShell>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  render() {
    if (this.state.err) {
      return (
        <div className="rounded-lg border-2 border-dashed p-8 text-center">
          <div className="font-semibold text-destructive mb-1">Something went wrong on this page.</div>
          <div className="text-xs text-muted-foreground mb-3">{this.state.err.message}</div>
          <button onClick={() => this.setState({ err: null })} className="text-sm px-3 py-1.5 rounded border">Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
