import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/supplier-portal")({
  head: () => ({ meta: [{ title: "Supplier Portal — PSG" }] }),
  component: SupplierPortalLayout,
});

const tabs = [
  { to: "/supplier-portal", label: "Dashboard", exact: true },
  { to: "/supplier-portal/products", label: "My Products" },
  { to: "/supplier-portal/products/new", label: "Add Product" },
  { to: "/orders", label: "Orders" },
  { to: "/messages", label: "Messages" },
  { to: "/offers", label: "Offers" },
  { to: "/onboarding/supplier", label: "Verification" },
];

function SupplierPortalLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 pt-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Supplier portal</div>
          <h1 className="font-display text-3xl">Manage your listings</h1>
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
        <Outlet />
      </div>
    </AppShell>
  );
}
