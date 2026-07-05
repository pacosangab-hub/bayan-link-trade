import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Bell, MessageSquare, Search, ShoppingCart, ChevronDown, Menu, LogIn } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useCartCount } from "@/lib/cart";
import { useSession, signOut } from "@/lib/auth";


const navLinks = [
  { to: "/", label: "Marketplace" },
  { to: "/products", label: "Products" },
  { to: "/suppliers", label: "Suppliers" },
  { to: "/rfq", label: "RFQ Center" },
  { to: "/offers", label: "Custom Offers" },
  { to: "/custom-requests", label: "Custom Requests" },
  { to: "/orders", label: "Orders" },
  { to: "/messages", label: "Messages" },
];

const dashboards = [
  { to: "/dashboard/buyer", label: "Buyer Dashboard" },
  { to: "/dashboard/supplier", label: "Supplier Dashboard" },
  { to: "/admin", label: "Admin Console" },
  { to: "/onboarding/supplier", label: "Become a Supplier" },
  { to: "/onboarding/buyer", label: "Register as Buyer" },
  { to: "/docs", label: "PRD & Architecture" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = useCartCount();
  const { user } = useSession();
  const navigate = useNavigate();
  const initials = (user?.user_metadata?.full_name || user?.email || "U").split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase();


  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top utility bar */}
      <div className="bg-ink text-white text-xs">
        <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between gap-4">
          <span className="opacity-90">🇵🇭 PSG — Connecting Philippine business, end to end.</span>
          <div className="hidden md:flex items-center gap-4 opacity-90">
            <span>Help Center</span>
            <span>Escrow Policy</span>
            <span>EN · TL</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="size-9 rounded-md gradient-hero grid place-items-center text-white font-display text-xl leading-none">
              P
            </div>
            <div className="leading-tight">
              <div className="font-display text-xl tracking-wide">PSG</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground -mt-0.5">
                Supply Gateway
              </div>
            </div>
          </Link>

          <div className="hidden md:flex flex-1 max-w-2xl">
            <div className="flex w-full border-2 border-primary rounded-md overflow-hidden">
              <select className="px-3 text-sm bg-muted border-r outline-none">
                <option>All</option>
                <option>Products</option>
                <option>Suppliers</option>
                <option>RFQs</option>
              </select>
              <input
                className="flex-1 px-3 py-2 text-sm outline-none"
                placeholder="Search rice, cement, paracetamol, tilapia…"
              />
              <button className="bg-primary text-primary-foreground px-5 grid place-items-center">
                <Search size={18} />
              </button>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <Link to="/messages" className="p-2 rounded hover:bg-muted relative">
              <MessageSquare size={20} />
              <span className="absolute top-1 right-1 size-2 bg-primary rounded-full" />
            </Link>
            <button className="p-2 rounded hover:bg-muted relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 size-2 bg-primary rounded-full" />
            </button>
            <Link to="/checkout" className="p-2 rounded hover:bg-muted relative">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold grid place-items-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button onClick={() => setMenuOpen((v) => !v)}
                  className="hidden md:flex items-center gap-2 ml-2 pl-3 pr-2 py-1.5 rounded-md border hover:bg-muted text-sm">
                  <div className="size-7 rounded-full bg-gradient-to-br from-primary to-gold grid place-items-center text-white text-xs font-bold">{initials}</div>
                  <span className="font-medium max-w-[120px] truncate">{user.user_metadata?.full_name || user.email}</span>
                  <ChevronDown size={14} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-60 bg-popover border rounded-md shadow-lg py-1 z-50">
                    {dashboards.map((d) => (
                      <Link key={d.to} to={d.to} onClick={() => setMenuOpen(false)}
                        className="block px-3 py-2 text-sm hover:bg-muted">{d.label}</Link>
                    ))}
                    <div className="border-t my-1" />
                    <button onClick={async () => { setMenuOpen(false); await signOut(); navigate({ to: "/" }); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted">Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/auth" className="hidden md:inline-flex items-center gap-1.5 ml-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90">
                <LogIn size={14} /> Sign in
              </Link>
            )}
            <button className="md:hidden p-2" onClick={() => setOpen((v) => !v)}>
              <Menu size={22} />
            </button>
          </div>
        </div>

        <nav className="border-t bg-muted/40">
          <div className="mx-auto max-w-7xl px-4 flex gap-1 overflow-x-auto text-sm">
            {navLinks.map((l) => {
              const active = l.to === "/" ? path === "/" : path.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`px-3 py-2.5 whitespace-nowrap font-medium border-b-2 transition-colors ${
                    active
                      ? "border-primary text-primary"
                      : "border-transparent text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {open && (
          <div className="md:hidden border-t px-4 py-3 space-y-1">
            {[...navLinks, ...dashboards].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm font-medium"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 gradient-ink text-white/80">
        <div className="mx-auto max-w-7xl px-4 py-12 grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="font-display text-2xl text-white mb-2">PSG</div>
            <p className="opacity-80 leading-relaxed">
              The B2B wholesale gateway for Philippine commerce. Verified suppliers, RFQs, and escrow on every transaction.
            </p>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Buyers</div>
            <ul className="space-y-2 opacity-90">
              <li>Browse marketplace</li><li>Post an RFQ</li><li>Escrow protection</li><li>Verified suppliers</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Suppliers</div>
            <ul className="space-y-2 opacity-90">
              <li>Become a seller</li><li>Upload catalog</li><li>Receive RFQs</li><li>Payout terms</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white mb-3">Company</div>
            <ul className="space-y-2 opacity-90">
              <li>About PSG</li><li>Trust & safety</li><li>Terms · Privacy</li><li>Help center</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 text-xs">
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-wrap justify-between gap-2 opacity-70">
            <span>© 2026 Philippine Supply Gateway, Inc.</span>
            <span>Metro Manila · Pampanga · Cebu · Davao</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
