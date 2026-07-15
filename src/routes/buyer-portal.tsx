import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Component, type ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { FileText, Store, ShoppingCart, Package } from "lucide-react";
import { useBusiness, useProfile } from "@/lib/user-profile";

export const Route = createFileRoute("/buyer-portal")({
  head: () => ({ meta: [{ title: "Buyer Portal — PSG Supply Gateway" }] }),
  component: () => (
    <RequireAuth roles={["buyer", "both", "admin"]}>
      <BuyerPortalLayout />
    </RequireAuth>
  ),
});

const tabs = [
  { to: "/buyer-portal", label: "Overview", exact: true },
  { to: "/buyer-portal/quote-requests", label: "Quote Requests" },
  { to: "/buyer-portal/offers", label: "Supplier Offers" },
  { to: "/buyer-portal/orders", label: "Orders" },
  { to: "/buyer-portal/deliveries", label: "Deliveries" },
  { to: "/buyer-portal/reorders", label: "Reorders" },
];

function BuyerPortalLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const profile = useProfile();
  const business = useBusiness();

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Buyer</div>
              <h1 className="font-display text-3xl">Buyer Portal</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track quote requests, supplier offers, protected orders, deliveries, and reorders.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">{business.businessName}</span>
                <span className="chip chip-verified">Buyer Account</span>
                <span className="text-muted-foreground">· {profile.city || business.city}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/rfq/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold">
              <FileText size={14} /> Post Quote Request
            </Link>
            <Link to="/suppliers" className="inline-flex items-center gap-2 border bg-card px-4 py-2 rounded-md text-sm font-semibold">
              <Store size={14} /> Browse Suppliers
            </Link>
            <Link to="/buyer-portal/orders" className="inline-flex items-center gap-2 border bg-card px-4 py-2 rounded-md text-sm font-semibold">
              <Package size={14} /> View Orders
            </Link>
            <Link to="/checkout" className="inline-flex items-center gap-2 border bg-card px-4 py-2 rounded-md text-sm font-semibold">
              <ShoppingCart size={14} /> Cart
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
