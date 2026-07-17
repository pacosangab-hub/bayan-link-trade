import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth, setAuthUser, getAuthUser } from "@/lib/auth-store";
import { User as UserIcon, Building2, Bell, ShieldCheck, KeyRound, MapPin, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — PSG" }] }),
  component: AccountPage,
});

const TABS = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "business", label: "Business", icon: Building2 },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: KeyRound },
] as const;

type TabId = (typeof TABS)[number]["id"];

function AccountPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("profile");

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md py-24 text-center px-4">
          <h1 className="font-display text-2xl">Sign in to manage your account</h1>
          <Link to="/login" className="inline-block mt-4 bg-primary text-primary-foreground rounded-md px-5 py-2.5 text-sm font-semibold">Log in</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <h1 className="font-display text-3xl">My Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile, business details, and preferences.</p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 grid md:grid-cols-[240px_1fr] gap-6">
        <aside>
          <nav className="rounded-lg border bg-card p-2">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium ${
                    active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Icon size={15} />
                  <span className="flex-1 text-left">{t.label}</span>
                  {!active && <ChevronRight size={14} className="text-muted-foreground" />}
                </button>
              );
            })}
          </nav>
          <Link to="/settings" className="mt-3 block text-xs text-primary font-semibold px-3">Appearance & theme settings →</Link>
        </aside>

        <div className="rounded-lg border bg-card p-6">
          {tab === "profile" && <ProfileTab />}
          {tab === "business" && <BusinessTab />}
          {tab === "addresses" && <AddressesTab />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "security" && <SecurityTab />}
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-xl">{title}</h2>
      {desc && <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}

const inputCls =
  "w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/40";

function ProfileTab() {
  const u = getAuthUser();
  const [fullName, setFullName] = useState(u?.fullName || "");
  const [email, setEmail] = useState(u?.email || "");
  return (
    <Section title="Profile" desc="Your personal contact information on PSG.">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Full name"><input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} /></Field>
        <Field label="Email"><input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Mobile"><input className={inputCls} defaultValue="+63 917 000 0000" /></Field>
        <Field label="Role"><input className={inputCls} defaultValue={u?.role} disabled /></Field>
      </div>
      <div className="pt-3 flex justify-end">
        <button
          onClick={() => {
            if (u) setAuthUser({ ...u, fullName, email });
            toast.success("Profile updated");
          }}
          className="bg-primary text-primary-foreground rounded-md px-5 py-2 text-sm font-semibold"
        >
          Save changes
        </button>
      </div>
    </Section>
  );
}

function BusinessTab() {
  const u = getAuthUser();
  const [name, setName] = useState(u?.businessName || "");
  return (
    <Section title="Business profile" desc="Details verified suppliers see when you post a quote request.">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Business name"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Industry"><input className={inputCls} defaultValue="Food & Beverage" /></Field>
        <Field label="TIN / BIR"><input className={inputCls} defaultValue="000-123-456-789" /></Field>
        <Field label="Business type"><input className={inputCls} defaultValue="Corporation" /></Field>
      </div>
      <Field label="About your business">
        <textarea className={`${inputCls} min-h-[100px]`} defaultValue="Multi-branch carinderia group serving Metro Manila. Regular procurement of rice, produce, and packaging." />
      </Field>
      <div className="rounded-md border bg-muted/40 p-4 flex items-start gap-3">
        <ShieldCheck size={18} className="text-success mt-0.5" />
        <div className="text-sm">
          <div className="font-semibold">Verified buyer</div>
          <p className="text-muted-foreground text-xs mt-0.5">Your account passed DTI + BIR verification. Suppliers see the "verified" badge on your requests.</p>
        </div>
      </div>
      <div className="pt-3 flex justify-end">
        <button
          onClick={() => {
            if (u) setAuthUser({ ...u, businessName: name });
            toast.success("Business updated");
          }}
          className="bg-primary text-primary-foreground rounded-md px-5 py-2 text-sm font-semibold"
        >
          Save changes
        </button>
      </div>
    </Section>
  );
}

function AddressesTab() {
  return (
    <Section title="Delivery addresses" desc="Add pickup and drop-off addresses to speed up checkout.">
      <div className="space-y-3">
        {["Project 8 Commissary — QC", "Marikina Branch"].map((addr, i) => (
          <div key={i} className="rounded-md border p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-semibold text-sm">{addr}</div>
              <div className="text-xs text-muted-foreground mt-0.5">Contact: Paco Reyes · +63 917 000 0000</div>
              {i === 0 && <span className="chip chip-verified text-[10px] mt-2">Default</span>}
            </div>
            <button className="text-xs text-primary font-semibold">Edit</button>
          </div>
        ))}
      </div>
      <button className="w-full border-2 border-dashed rounded-md py-3 text-sm font-semibold text-muted-foreground hover:bg-muted/40">
        + Add new address
      </button>
    </Section>
  );
}

function NotificationsTab() {
  const items = [
    { key: "quotes", label: "New quotes on my RFQs", desc: "Get notified when suppliers respond." },
    { key: "orders", label: "Order status updates", desc: "Preparing, shipped, delivered." },
    { key: "escrow", label: "Escrow events", desc: "Payment holds, releases, disputes." },
    { key: "marketing", label: "Product recommendations", desc: "Suggested reorders and new suppliers." },
  ];
  return (
    <Section title="Notifications" desc="Choose which updates land in your inbox.">
      <div className="space-y-2">
        {items.map((i) => (
          <label key={i.key} className="flex items-start gap-3 p-3 border rounded-md hover:bg-muted/40 cursor-pointer">
            <input type="checkbox" defaultChecked={i.key !== "marketing"} className="mt-1" />
            <div>
              <div className="text-sm font-semibold">{i.label}</div>
              <div className="text-xs text-muted-foreground">{i.desc}</div>
            </div>
          </label>
        ))}
      </div>
    </Section>
  );
}

function SecurityTab() {
  return (
    <Section title="Security" desc="Protect your account.">
      <div className="rounded-md border p-4">
        <div className="font-semibold text-sm">Password</div>
        <p className="text-xs text-muted-foreground mt-1">Change your password regularly.</p>
        <button className="mt-3 border rounded-md px-4 py-2 text-xs font-semibold">Change password</button>
      </div>
      <div className="rounded-md border p-4">
        <div className="font-semibold text-sm">Two-factor authentication</div>
        <p className="text-xs text-muted-foreground mt-1">Add a second layer of protection to your account.</p>
        <button className="mt-3 bg-primary text-primary-foreground rounded-md px-4 py-2 text-xs font-semibold">Enable 2FA</button>
      </div>
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
        <div className="font-semibold text-sm text-destructive">Delete account</div>
        <p className="text-xs text-muted-foreground mt-1">Permanently remove your PSG account and data.</p>
        <button className="mt-3 border border-destructive text-destructive rounded-md px-4 py-2 text-xs font-semibold">Delete account</button>
      </div>
    </Section>
  );
}
