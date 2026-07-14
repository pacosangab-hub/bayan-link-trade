import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { useAuth } from "@/lib/auth-store";
import { Sun, Moon, Monitor, User, Building2, Bell, Shield, Palette } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — PSG Supply Gateway" },
      { name: "description", content: "Manage your account, appearance, and app preferences." },
    ],
  }),
  component: SettingsPage,
});

const NOTIF_KEY = "psg-notification-prefs";
type NotifPrefs = {
  quotes: boolean;
  orders: boolean;
  payments: boolean;
  messages: boolean;
  security: boolean;
};
const DEFAULT_NOTIFS: NotifPrefs = { quotes: true, orders: true, payments: true, messages: true, security: true };

function SettingsPage() {
  const { user } = useAuth();

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8 md:py-12 space-y-8">
        <header>
          <h1 className="font-display text-4xl md:text-5xl tracking-wide">Settings</h1>
          <p className="mt-2 text-muted-foreground">Manage your account, appearance, and app preferences.</p>
        </header>

        <AppearanceSection />
        <AccountSection user={user} />
        <BusinessProfileSection user={user} />
        <NotificationsSection />
        <SecuritySection />
      </div>
    </AppShell>
  );
}

function Section({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card text-card-foreground p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-1">
        <div className="size-9 rounded-md bg-muted grid place-items-center text-primary">{icon}</div>
        <div>
          <h2 className="font-semibold text-lg leading-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function AppearanceSection() {
  const { mode, setMode } = useTheme();

  const choose = (m: ThemeMode) => {
    setMode(m);
    if (m === "dark") toast.success("Dark mode enabled");
    else if (m === "light") toast.success("Light mode enabled");
    else toast("Using system appearance");
  };

  const opts: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun size={16} /> },
    { value: "dark", label: "Dark", icon: <Moon size={16} /> },
    { value: "system", label: "System", icon: <Monitor size={16} /> },
  ];

  return (
    <Section icon={<Palette size={18} />} title="Appearance" description="Customize how PSG Supply Gateway looks on your device.">
      <div className="space-y-2">
        <div className="text-sm font-medium">Theme Mode</div>
        <div className="inline-flex rounded-md border bg-muted p-1">
          {opts.map((o) => {
            const active = mode === o.value;
            return (
              <button
                key={o.value}
                onClick={() => choose(o.value)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded transition-colors ${
                  active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.icon} {o.label}
              </button>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

function AccountSection({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  const role = user?.role;
  const roleLabel = role === "both" ? "Buyer + Supplier" : role ? role[0].toUpperCase() + role.slice(1) : "Guest";
  return (
    <Section icon={<User size={18} />} title="Account" description="Your PSG account details.">
      <dl className="grid sm:grid-cols-2 gap-4 text-sm">
        <Field label="Name" value={user?.fullName || "—"} />
        <Field label="Email" value={user?.email || "—"} />
        <Field label="Account type" value={roleLabel} />
        <Field label="Member since" value="2026" />
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        {role === "buyer" && (
          <Link to="/buyer-portal" className="px-4 py-2 text-sm font-semibold rounded-md border hover:bg-muted">Buyer Preferences</Link>
        )}
        {role === "supplier" && (
          <Link to="/supplier-portal" className="px-4 py-2 text-sm font-semibold rounded-md border hover:bg-muted">Supplier Profile</Link>
        )}
        {role === "both" && (
          <>
            <Link to="/buyer-portal" className="px-4 py-2 text-sm font-semibold rounded-md border hover:bg-muted">Buyer Preferences</Link>
            <Link to="/supplier-portal" className="px-4 py-2 text-sm font-semibold rounded-md border hover:bg-muted">Supplier Profile</Link>
            <Link to="/supplier-portal" className="px-4 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground">
              Switch to Supplier Portal
            </Link>
          </>
        )}
        {role === "admin" && (
          <Link to="/admin" className="px-4 py-2 text-sm font-semibold rounded-md border hover:bg-muted">Admin Portal</Link>
        )}
      </div>
    </Section>
  );
}

function BusinessProfileSection({ user }: { user: ReturnType<typeof useAuth>["user"] }) {
  return (
    <Section icon={<Building2 size={18} />} title="Business Profile" description="Your business details on PSG.">
      <dl className="grid sm:grid-cols-2 gap-4 text-sm">
        <Field label="Business name" value={user?.businessName || "—"} />
        <Field label="Location" value="Metro Manila" />
        <Field label="Region" value="NCR" />
        <Field label="Business email" value={user?.email || "—"} />
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to="/onboarding" className="px-4 py-2 text-sm font-semibold rounded-md border hover:bg-muted">
          Edit Business Profile
        </Link>
        {(user?.role === "supplier" || user?.role === "both") && (
          <Link to="/supplier-portal/preview" className="px-4 py-2 text-sm font-semibold rounded-md border hover:bg-muted">
            Preview Public Profile
          </Link>
        )}
      </div>
    </Section>
  );
}


function NotificationsSection() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_NOTIFS);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(NOTIF_KEY);
      if (raw) setPrefs({ ...DEFAULT_NOTIFS, ...JSON.parse(raw) });
    } catch { /* noop */ }
  }, []);

  const update = (key: keyof NotifPrefs) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try { window.localStorage.setItem(NOTIF_KEY, JSON.stringify(next)); } catch { /* noop */ }
  };

  const rows: { key: keyof NotifPrefs; label: string }[] = [
    { key: "quotes", label: "Quote request updates" },
    { key: "orders", label: "Order updates" },
    { key: "payments", label: "Payment updates" },
    { key: "messages", label: "Supplier messages" },
    { key: "security", label: "Admin / security alerts" },
  ];

  return (
    <Section icon={<Bell size={18} />} title="Notification Preferences" description="Choose what PSG alerts you about.">
      <ul className="divide-y">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between py-3">
            <span className="text-sm">{r.label}</span>
            <Toggle checked={prefs[r.key]} onChange={() => update(r.key)} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function SecuritySection() {
  return (
    <Section icon={<Shield size={18} />} title="Security" description="Manage your password and session.">
      <div className="flex flex-wrap gap-2">
        <Link to="/forgot-password" className="px-4 py-2 text-sm font-semibold rounded-md border hover:bg-muted">
          Change Password
        </Link>
        <button
          onClick={() => toast("Signed out of this device")}
          className="px-4 py-2 text-sm font-semibold rounded-md border hover:bg-muted"
        >
          Logout from this device
        </button>
      </div>
    </Section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      }`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}
