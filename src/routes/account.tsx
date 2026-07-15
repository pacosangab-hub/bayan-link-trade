import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  useProfile, useBusiness, useNotifications, useAccountType, useDefaultPortal,
  setProfile, setBusiness, setNotifications, setAccountType, setDefaultPortal,
  BUSINESS_TYPES, INDUSTRIES, BUYER_PRODUCT_CHIPS, BUYING_FREQUENCY, ORDER_SIZE, PREFERRED_DELIVERY,
  SUPPLIER_TYPES, SUPPLIER_CATEGORIES,
  getBuyerPrefs, setBuyerPrefs, getSupplierPrefs, setSupplierPrefs,
  type PersonalProfile, type BusinessProfile, type NotificationPrefs, type AccountType,
  type BuyerPreferences, type SupplierPrefs,
} from "@/lib/user-profile";
import { useAuth } from "@/lib/auth-store";
import { User as UserIcon, Building2, Layers, Sliders, Shield, Bell, Save } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — PSG Supply Gateway" }] }),
  component: () => (
    <RequireAuth>
      <AccountPage />
    </RequireAuth>
  ),
});

type TabKey = "profile" | "business" | "role" | "preferences" | "security" | "notifications";

function AccountPage() {
  const [tab, setTab] = useState<TabKey>("profile");
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "profile", label: "Profile", icon: <UserIcon size={14} /> },
    { key: "business", label: "Business", icon: <Building2 size={14} /> },
    { key: "role", label: "Role & Portal", icon: <Layers size={14} /> },
    { key: "preferences", label: "Preferences", icon: <Sliders size={14} /> },
    { key: "security", label: "Security", icon: <Shield size={14} /> },
    { key: "notifications", label: "Notifications", icon: <Bell size={14} /> },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12 space-y-6">
        <header>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide">My Account</h1>
          <p className="mt-2 text-muted-foreground">Manage your profile, business details, preferences, and security.</p>
        </header>

        <nav className="flex flex-wrap gap-1 border-b -mb-px">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 px-3 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </nav>

        {tab === "profile" && <ProfileTab />}
        {tab === "business" && <BusinessTab />}
        {tab === "role" && <RoleTab />}
        {tab === "preferences" && <PreferencesTab />}
        {tab === "security" && <SecurityTab />}
        {tab === "notifications" && <NotificationsTab />}
      </div>
    </AppShell>
  );
}

function Card({ title, subtitle, children }: any) {
  return (
    <section className="rounded-lg border bg-card p-6 shadow-sm">
      <h2 className="font-semibold text-lg">{title}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: any) {
  return (
    <label className="block">
      <div className="text-sm font-semibold mb-1">{label}</div>
      {children}
    </label>
  );
}

const inputCls = "w-full border rounded-md px-3 py-2 text-sm bg-background";

function ProfileTab() {
  const initial = useProfile();
  const [p, setP] = useState<PersonalProfile>(initial);
  const [editing, setEditing] = useState(false);

  const initials = (p.fullName || p.email || "U").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  function save() {
    setProfile(p); setEditing(false); toast.success("Profile saved");
  }

  return (
    <Card title="Personal Profile" subtitle="How you appear across PSG.">
      <div className="flex items-center gap-4 mb-5">
        <div className="size-16 rounded-full bg-gradient-to-br from-primary to-gold grid place-items-center text-white text-xl font-bold">{initials}</div>
        <div className="text-xs text-muted-foreground">Avatar uploads will be enabled after backend setup.</div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Full name"><input disabled={!editing} className={inputCls} value={p.fullName} onChange={(e) => setP({ ...p, fullName: e.target.value })} /></Field>
        <Field label="Display name"><input disabled={!editing} className={inputCls} value={p.displayName} onChange={(e) => setP({ ...p, displayName: e.target.value })} /></Field>
        <Field label="Email">
          <input disabled className={inputCls} value={p.email} />
          <div className="text-[11px] text-muted-foreground mt-1">Email changes will be available after account verification.</div>
        </Field>
        <Field label="Phone"><input disabled={!editing} className={inputCls} value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} /></Field>
        <Field label="Job title / position"><input disabled={!editing} className={inputCls} value={p.jobTitle} onChange={(e) => setP({ ...p, jobTitle: e.target.value })} /></Field>
        <Field label="City"><input disabled={!editing} className={inputCls} value={p.city} onChange={(e) => setP({ ...p, city: e.target.value })} /></Field>
        <Field label="Region"><input disabled={!editing} className={inputCls} value={p.region} onChange={(e) => setP({ ...p, region: e.target.value })} /></Field>
      </div>

      <div className="mt-5 flex gap-2">
        {editing ? (
          <>
            <button onClick={save} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded font-semibold text-sm"><Save size={14} /> Save Changes</button>
            <button onClick={() => { setP(initial); setEditing(false); }} className="border rounded px-4 py-2 text-sm font-semibold">Cancel</button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded font-semibold text-sm">Edit Profile</button>
        )}
      </div>
    </Card>
  );
}

function BusinessTab() {
  const initial = useBusiness();
  const [b, setB] = useState<BusinessProfile>(initial);
  const [editing, setEditing] = useState(false);

  function save() { setBusiness(b); setEditing(false); toast.success("Business profile saved"); }

  return (
    <Card title="Business Profile" subtitle="Your public buyer/supplier information.">
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Business name"><input disabled={!editing} className={inputCls} value={b.businessName} onChange={(e) => setB({ ...b, businessName: e.target.value })} /></Field>
        <Field label="Business type">
          <select disabled={!editing} className={inputCls} value={b.businessType} onChange={(e) => setB({ ...b, businessType: e.target.value })}>
            {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Industry">
          <select disabled={!editing} className={inputCls} value={b.industry} onChange={(e) => setB({ ...b, industry: e.target.value })}>
            {INDUSTRIES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Business email"><input disabled={!editing} className={inputCls} value={b.email} onChange={(e) => setB({ ...b, email: e.target.value })} /></Field>
        <Field label="Business phone"><input disabled={!editing} className={inputCls} value={b.phone} onChange={(e) => setB({ ...b, phone: e.target.value })} /></Field>
        <Field label="Business address"><input disabled={!editing} className={inputCls} value={b.address} onChange={(e) => setB({ ...b, address: e.target.value })} /></Field>
        <Field label="City"><input disabled={!editing} className={inputCls} value={b.city} onChange={(e) => setB({ ...b, city: e.target.value })} /></Field>
        <Field label="Region"><input disabled={!editing} className={inputCls} value={b.region} onChange={(e) => setB({ ...b, region: e.target.value })} /></Field>
        <Field label="Website / Facebook page"><input disabled={!editing} className={inputCls} value={b.website} onChange={(e) => setB({ ...b, website: e.target.value })} /></Field>
        <Field label="Contact person"><input disabled={!editing} className={inputCls} value={b.contactPerson} onChange={(e) => setB({ ...b, contactPerson: e.target.value })} /></Field>
        <Field label="Tax ID / business registration (optional)"><input disabled={!editing} className={inputCls} value={b.taxId} onChange={(e) => setB({ ...b, taxId: e.target.value })} /></Field>
        <Field label="Can issue invoice?">
          <select disabled={!editing} className={inputCls} value={b.canIssueInvoice} onChange={(e) => setB({ ...b, canIssueInvoice: e.target.value as any })}>
            <option>Yes</option><option>No</option><option>Depends</option>
          </select>
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Business description"><textarea disabled={!editing} className={`${inputCls} min-h-[100px]`} value={b.description} onChange={(e) => setB({ ...b, description: e.target.value })} /></Field>
      </div>
      <div className="mt-5 flex gap-2">
        {editing ? (
          <>
            <button onClick={save} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded font-semibold text-sm"><Save size={14} /> Save Changes</button>
            <button onClick={() => { setB(initial); setEditing(false); }} className="border rounded px-4 py-2 text-sm font-semibold">Cancel</button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded font-semibold text-sm">Edit Business Profile</button>
        )}
      </div>
    </Card>
  );
}

function RoleTab() {
  const { user } = useAuth();
  const authRole = (user?.role || "buyer") as AccountType;
  const stored = useAccountType(authRole);
  const type: AccountType = stored;
  const defaultPortal = useDefaultPortal();
  const navigate = useNavigate();

  const ROLE_LABEL: Record<AccountType, string> = { buyer: "Buyer", supplier: "Supplier", both: "Buyer + Supplier", admin: "Admin" };

  function change(next: AccountType) {
    if (next === "admin") { toast.error("Admin role can only be assigned by PSG."); return; }
    setAccountType(next);
    toast.success(`Account type updated to ${ROLE_LABEL[next]}`);
  }

  return (
    <Card title="Account Type & Portal Access" subtitle="Choose how you use PSG.">
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <Info label="Current account type" value={ROLE_LABEL[type]} />
        <Info label="Default portal" value={type === "admin" ? "Admin Portal" : type === "supplier" ? "Supplier Portal" : defaultPortal === "supplier" ? "Supplier Portal" : "Buyer Portal"} />
        <Info label="Onboarding status" value="Complete" />
        <Info label="Available portals" value={
          type === "admin" ? "Admin Portal" :
          type === "both" ? "Buyer Portal · Supplier Portal" :
          type === "supplier" ? "Supplier Portal" : "Buyer Portal"
        } />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(type === "buyer" || type === "both") && (
          <button onClick={() => navigate({ to: "/buyer-portal" })} className="border rounded px-4 py-2 text-sm font-semibold hover:bg-muted">Go to Buyer Portal</button>
        )}
        {(type === "supplier" || type === "both") && (
          <button onClick={() => navigate({ to: "/supplier-portal" })} className="border rounded px-4 py-2 text-sm font-semibold hover:bg-muted">Go to Supplier Portal</button>
        )}
        {type === "admin" && (
          <button onClick={() => navigate({ to: "/admin" })} className="border rounded px-4 py-2 text-sm font-semibold hover:bg-muted">Go to Admin Portal</button>
        )}
        {type === "both" && (
          <>
            <button onClick={() => { setDefaultPortal("buyer"); toast.success("Buyer Portal is now default"); }} className={`border rounded px-4 py-2 text-sm font-semibold hover:bg-muted ${defaultPortal === "buyer" ? "bg-primary/10 border-primary" : ""}`}>Set Buyer as Default</button>
            <button onClick={() => { setDefaultPortal("supplier"); toast.success("Supplier Portal is now default"); }} className={`border rounded px-4 py-2 text-sm font-semibold hover:bg-muted ${defaultPortal === "supplier" ? "bg-primary/10 border-primary" : ""}`}>Set Supplier as Default</button>
          </>
        )}
      </div>

      {type !== "admin" && (
        <div className="mt-6 border-t pt-5">
          <div className="text-sm font-semibold mb-2">Change Account Type</div>
          <div className="flex flex-wrap gap-2">
            {(["buyer", "supplier", "both"] as AccountType[]).map((r) => (
              <button key={r} onClick={() => change(r)}
                className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${type === r ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2">Admin access is assigned only by PSG.</div>
        </div>
      )}
    </Card>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded bg-muted/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

function PreferencesTab() {
  const type = useAccountType();
  return (
    <div className="space-y-6">
      {(type === "buyer" || type === "both") && <BuyerPrefsCard />}
      {(type === "supplier" || type === "both") && <SupplierPrefsCard />}
    </div>
  );
}

function chipList<T extends string>(items: T[], selected: T[], onToggle: (v: T) => void) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((c) => {
        const on = selected.includes(c);
        return (
          <button key={c} type="button" onClick={() => onToggle(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"}`}>
            {c}
          </button>
        );
      })}
    </div>
  );
}

function BuyerPrefsCard() {
  const [p, setP] = useState<BuyerPreferences>(() => getBuyerPrefs());
  const toggle = <K extends keyof BuyerPreferences>(k: K, v: string) => {
    const arr = (p[k] as unknown as string[]) || [];
    const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
    setP({ ...p, [k]: next as any });
  };
  function save() { setBuyerPrefs(p); toast.success("Buyer preferences saved"); }
  return (
    <Card title="Buyer Sourcing Preferences" subtitle="Helps us surface the right suppliers and offers.">
      <div className="space-y-5">
        <div>
          <div className="text-sm font-semibold mb-2">Main products usually bought</div>
          {chipList(BUYER_PRODUCT_CHIPS, p.products, (v) => toggle("products", v))}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Buying frequency"><select className={inputCls} value={p.frequency} onChange={(e) => setP({ ...p, frequency: e.target.value })}>{BUYING_FREQUENCY.map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Usual order size"><select className={inputCls} value={p.orderSize} onChange={(e) => setP({ ...p, orderSize: e.target.value })}>{ORDER_SIZE.map((x) => <option key={x}>{x}</option>)}</select></Field>
        </div>
        <div>
          <div className="text-sm font-semibold mb-2">Preferred delivery methods</div>
          {chipList(PREFERRED_DELIVERY, p.deliveryMethods, (v) => toggle("deliveryMethods", v))}
        </div>
        <Field label="Biggest sourcing problems"><textarea className={`${inputCls} min-h-[80px]`} value={p.problems} onChange={(e) => setP({ ...p, problems: e.target.value })} /></Field>
        <button onClick={save} className="bg-primary text-primary-foreground px-4 py-2 rounded font-semibold text-sm inline-flex items-center gap-2"><Save size={14} /> Save Preferences</button>
      </div>
    </Card>
  );
}

function SupplierPrefsCard() {
  const [p, setP] = useState<SupplierPrefs>(() => getSupplierPrefs());
  const toggleCat = (v: string) => setP({ ...p, categories: p.categories.includes(v) ? p.categories.filter((x) => x !== v) : [...p.categories, v] });
  const toggleDel = (v: string) => setP({ ...p, deliveryCapability: p.deliveryCapability.includes(v) ? p.deliveryCapability.filter((x) => x !== v) : [...p.deliveryCapability, v] });
  function save() { setSupplierPrefs(p); toast.success("Supplier preferences saved"); }
  return (
    <Card title="Supplier Preferences" subtitle="Tell buyers what you sell and how you deliver.">
      <div className="space-y-5">
        <Field label="Supplier type"><select className={inputCls} value={p.supplierType} onChange={(e) => setP({ ...p, supplierType: e.target.value })}>{SUPPLIER_TYPES.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <div>
          <div className="text-sm font-semibold mb-2">Main categories sold</div>
          {chipList(SUPPLIER_CATEGORIES, p.categories, toggleCat)}
        </div>
        <Field label="Minimum order range"><input className={inputCls} value={p.minOrder} onChange={(e) => setP({ ...p, minOrder: e.target.value })} /></Field>
        <div>
          <div className="text-sm font-semibold mb-2">Delivery capability</div>
          {chipList(PREFERRED_DELIVERY, p.deliveryCapability, toggleDel)}
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.protectedPayments} onChange={(e) => setP({ ...p, protectedPayments: e.target.checked })} /> Open to protected payments</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.canIssueInvoice} onChange={(e) => setP({ ...p, canIssueInvoice: e.target.checked })} /> Can issue invoice</label>
        <button onClick={save} className="bg-primary text-primary-foreground px-4 py-2 rounded font-semibold text-sm inline-flex items-center gap-2"><Save size={14} /> Save Preferences</button>
      </div>
    </Card>
  );
}

function SecurityTab() {
  return (
    <Card title="Security" subtitle="Manage your password and session.">
      <div className="grid sm:grid-cols-2 gap-3 text-sm">
        <Info label="Password" value="••••••••" />
        <Info label="Two-factor authentication" value="Not enabled (coming soon)" />
        <Info label="Active sessions" value="This device only" />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/forgot-password" className="border rounded px-4 py-2 text-sm font-semibold hover:bg-muted">Change Password</Link>
        <button onClick={() => toast("Signed out of this device")} className="border rounded px-4 py-2 text-sm font-semibold hover:bg-muted">Logout from this device</button>
        <button onClick={() => toast("Account deletion request sent to PSG support")} className="border rounded px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10">Request Account Deletion</button>
      </div>
      <div className="mt-3 text-[11px] text-muted-foreground">Password reset uses your account email. Full password/2FA management will be available after backend setup.</div>
    </Card>
  );
}

function NotificationsTab() {
  const initial = useNotifications();
  const [n, setN] = useState<NotificationPrefs>(initial);
  const rows: { key: keyof NotificationPrefs; label: string }[] = [
    { key: "quotes", label: "Quote request updates" },
    { key: "offers", label: "Supplier offer updates" },
    { key: "orders", label: "Order updates" },
    { key: "deliveries", label: "Delivery updates" },
    { key: "payments", label: "Payment / protected payment updates" },
    { key: "messages", label: "Message notifications" },
    { key: "reorders", label: "Reorder reminders" },
    { key: "verification", label: "Verification updates" },
    { key: "security", label: "Security alerts" },
    { key: "admin", label: "Admin / account alerts" },
  ];
  function save() { setNotifications(n); toast.success("Notification settings saved"); }
  return (
    <Card title="Notification Preferences" subtitle="Choose what PSG alerts you about.">
      <ul className="divide-y">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between py-3">
            <span className="text-sm">{r.label}</span>
            <button role="switch" aria-checked={n[r.key]} onClick={() => setN({ ...n, [r.key]: !n[r.key] })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${n[r.key] ? "bg-primary" : "bg-muted-foreground/30"}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${n[r.key] ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <button onClick={save} className="bg-primary text-primary-foreground px-4 py-2 rounded font-semibold text-sm inline-flex items-center gap-2"><Save size={14} /> Save Notification Settings</button>
      </div>
    </Card>
  );
}
