import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useState } from "react";
import { toast } from "sonner";
import {
  useProfile, saveProfile, useBusiness, saveBusiness,
  usePreferences, savePreferences, useNotifs, saveNotifs,
  type UserProfile, type BusinessProfile, type BuyerPreferences, type NotificationPrefs,
} from "@/lib/buyer-store";
import { DELIVERY_METHOD_LIST } from "@/lib/delivery";
import { UserIcon as User, Building2, Shield, Bell, SlidersHorizontal, KeyRound } from "lucide-react";

// lucide's `UserIcon` alias for consistent import
import { User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — PSG" }] }),
  component: () => (
    <RequireAuth>
      <AccountPage />
    </RequireAuth>
  ),
});

type Tab = "profile" | "business" | "role" | "preferences" | "security" | "notifications";

function AccountPage() {
  const [tab, setTab] = useState<Tab>("profile");
  return (
    <AppShell>
      <div className="bg-muted/40 border-b">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Account</div>
          <h1 className="font-display text-3xl mt-0.5">My Account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your profile, business details, preferences, and security.
          </p>
        </div>
      </div>

      <div className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 flex gap-1 overflow-x-auto text-sm">
          {[
            { k: "profile", l: "Profile", i: UserIcon },
            { k: "business", l: "Business", i: Building2 },
            { k: "role", l: "Role & Portal", i: SlidersHorizontal },
            { k: "preferences", l: "Preferences", i: SlidersHorizontal },
            { k: "security", l: "Security", i: Shield },
            { k: "notifications", l: "Notifications", i: Bell },
          ].map(({ k, l, i: Icon }) => (
            <button key={k} onClick={() => setTab(k as Tab)}
              className={`inline-flex items-center gap-1.5 px-3 py-3 whitespace-nowrap font-medium border-b-2 transition-colors ${tab === k ? "border-primary text-primary" : "border-transparent text-foreground/70 hover:text-foreground"}`}>
              <Icon size={14} /> {l}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg p-6 bg-card space-y-4">
      <h2 className="font-display text-xl">{title}</h2>
      {children}
    </div>
  );
}
function TextInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-md px-3 py-2 bg-background" />
    </label>
  );
}

function ProfileTab() {
  const initial = useProfile();
  const [f, setF] = useState<UserProfile>(initial);
  const set = <K extends keyof UserProfile>(k: K, v: UserProfile[K]) => setF({ ...f, [k]: v });
  return (
    <Section title="Profile">
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="Full name" value={f.fullName} onChange={(v) => set("fullName", v)} />
        <TextInput label="Display name" value={f.displayName} onChange={(v) => set("displayName", v)} />
        <TextInput label="Email address" value={f.email} onChange={(v) => set("email", v)} type="email" />
        <TextInput label="Phone number" value={f.phone} onChange={(v) => set("phone", v)} />
        <TextInput label="Job title / position" value={f.jobTitle} onChange={(v) => set("jobTitle", v)} />
        <TextInput label="Location / city" value={f.city} onChange={(v) => set("city", v)} />
        <TextInput label="Region" value={f.region} onChange={(v) => set("region", v)} />
        <TextInput label="Profile photo URL" value={f.avatar} onChange={(v) => set("avatar", v)} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={() => setF(initial)} className="border rounded-md px-4 py-2 text-sm">Cancel</button>
        <button onClick={() => { saveProfile(f); toast.success("Profile saved"); }}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold">Save Changes</button>
      </div>
    </Section>
  );
}

function BusinessTab() {
  const initial = useBusiness();
  const [f, setF] = useState<BusinessProfile>(initial);
  const set = <K extends keyof BusinessProfile>(k: K, v: BusinessProfile[K]) => setF({ ...f, [k]: v });
  return (
    <Section title="Business">
      <div className="grid sm:grid-cols-2 gap-4">
        <TextInput label="Business name" value={f.businessName} onChange={(v) => set("businessName", v)} />
        <TextInput label="Business type" value={f.businessType} onChange={(v) => set("businessType", v)} />
        <TextInput label="Industry" value={f.industry} onChange={(v) => set("industry", v)} />
        <TextInput label="Business email" value={f.businessEmail} onChange={(v) => set("businessEmail", v)} />
        <TextInput label="Business phone" value={f.businessPhone} onChange={(v) => set("businessPhone", v)} />
        <TextInput label="Business address" value={f.address} onChange={(v) => set("address", v)} />
        <TextInput label="City" value={f.city} onChange={(v) => set("city", v)} />
        <TextInput label="Region" value={f.region} onChange={(v) => set("region", v)} />
        <TextInput label="Website / Facebook page" value={f.website} onChange={(v) => set("website", v)} />
        <TextInput label="Contact person" value={f.contactPerson} onChange={(v) => set("contactPerson", v)} />
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Can issue invoice?</span>
          <select value={f.canIssueInvoice} onChange={(e) => set("canIssueInvoice", e.target.value as BusinessProfile["canIssueInvoice"])}
            className="w-full border rounded-md px-3 py-2 bg-background">
            {["Yes", "No", "Depends"].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Business description</span>
        <textarea value={f.description} onChange={(e) => set("description", e.target.value)} rows={3}
          className="w-full border rounded-md px-3 py-2 bg-background" />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={() => setF(initial)} className="border rounded-md px-4 py-2 text-sm">Cancel</button>
        <button onClick={() => { saveBusiness(f); toast.success("Business profile saved"); }}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold">Save Changes</button>
      </div>
    </Section>
  );
}

function RoleTab() {
  return (
    <Section title="Role & Portal">
      <div className="grid sm:grid-cols-2 gap-4 text-sm">
        <InfoRow label="Current account type" value="Buyer" />
        <InfoRow label="Current default portal" value="Buyer Portal" />
        <InfoRow label="Available portal" value="Buyer Portal" />
        <InfoRow label="Onboarding status" value="Complete" />
      </div>
      <Link to="/buyer-portal" className="mt-4 inline-flex bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold">
        Go to Buyer Portal
      </Link>
    </Section>
  );
}
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</div>
      <div className="font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function PreferencesTab() {
  const initial = usePreferences();
  const [f, setF] = useState<BuyerPreferences>(initial);
  const set = <K extends keyof BuyerPreferences>(k: K, v: BuyerPreferences[K]) => setF({ ...f, [k]: v });
  const toggleMethod = (key: string) => {
    const has = f.preferredDeliveryMethods.includes(key);
    set("preferredDeliveryMethods", has ? f.preferredDeliveryMethods.filter((x) => x !== key) : [...f.preferredDeliveryMethods, key]);
  };
  return (
    <Section title="Preferences">
      <TextInput label="Main products usually bought" value={f.mainProducts} onChange={(v) => set("mainProducts", v)} />
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Buying frequency</span>
          <select value={f.buyingFrequency} onChange={(e) => set("buyingFrequency", e.target.value)} className="w-full border rounded-md px-3 py-2 bg-background">
            {["Daily", "Weekly", "Every 2 weeks", "Monthly", "As needed"].map((v) => <option key={v}>{v}</option>)}
          </select>
        </label>
        <TextInput label="Usual order size" value={f.usualOrderSize} onChange={(v) => set("usualOrderSize", v)} />
      </div>
      <TextInput label="Preferred supplier locations" value={f.preferredSupplierLocations} onChange={(v) => set("preferredSupplierLocations", v)} />
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Preferred delivery methods</div>
        <div className="grid sm:grid-cols-3 gap-2">
          {DELIVERY_METHOD_LIST.map((m) => (
            <label key={m.key} className={`border rounded-md p-3 cursor-pointer flex items-start gap-2 ${f.preferredDeliveryMethods.includes(m.key) ? "border-primary bg-primary/5" : ""}`}>
              <input type="checkbox" checked={f.preferredDeliveryMethods.includes(m.key)} onChange={() => toggleMethod(m.key)} className="mt-1" />
              <div>
                <div className="font-semibold text-sm">{m.label}</div>
                <div className="text-xs text-muted-foreground">{m.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Biggest sourcing problems</span>
        <textarea value={f.sourcingProblems} onChange={(e) => set("sourcingProblems", e.target.value)} rows={3} className="w-full border rounded-md px-3 py-2 bg-background" />
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button onClick={() => setF(initial)} className="border rounded-md px-4 py-2 text-sm">Cancel</button>
        <button onClick={() => { savePreferences(f); toast.success("Preferences saved"); }}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold">Save Changes</button>
      </div>
    </Section>
  );
}

function SecurityTab() {
  return (
    <Section title="Security">
      <div className="border rounded-md p-4 bg-muted/40 text-sm">
        <div className="flex items-center gap-2 font-semibold"><KeyRound size={14} /> Password</div>
        <p className="text-muted-foreground text-xs mt-1">Password management will be available after backend setup.</p>
      </div>
      <div className="border rounded-md p-4 text-sm">
        <div className="font-semibold">Two-factor authentication</div>
        <p className="text-muted-foreground text-xs mt-1">Coming soon.</p>
      </div>
      <div className="border rounded-md p-4 text-sm">
        <div className="font-semibold">Active sessions</div>
        <p className="text-muted-foreground text-xs mt-1">Session management coming soon.</p>
        <button onClick={() => toast.success("Logged out of this device")} className="mt-3 border rounded-md px-3 py-1.5 text-xs font-semibold">
          Log out of this device
        </button>
      </div>
      <div className="border rounded-md p-4 text-sm border-destructive/30 bg-destructive/5">
        <div className="font-semibold text-destructive">Delete account</div>
        <p className="text-muted-foreground text-xs mt-1">Account deletion will be available after backend setup.</p>
      </div>
    </Section>
  );
}

function NotificationsTab() {
  const initial = useNotifs();
  const [f, setF] = useState<NotificationPrefs>(initial);
  const toggle = (k: keyof NotificationPrefs) => setF({ ...f, [k]: !f[k] });
  const rows: { k: keyof NotificationPrefs; label: string }[] = [
    { k: "quoteUpdates", label: "Quote request updates" },
    { k: "offerUpdates", label: "Supplier offer updates" },
    { k: "orderUpdates", label: "Order updates" },
    { k: "deliveryUpdates", label: "Delivery updates" },
    { k: "paymentUpdates", label: "Payment / protected payment updates" },
    { k: "messages", label: "Message notifications" },
    { k: "reorderReminders", label: "Reorder reminders" },
    { k: "verificationUpdates", label: "Verification updates" },
    { k: "securityAlerts", label: "Security alerts" },
  ];
  return (
    <Section title="Notifications">
      <div className="divide-y border rounded-md">
        {rows.map((r) => (
          <label key={r.k} className="flex items-center justify-between p-3 cursor-pointer">
            <span className="text-sm">{r.label}</span>
            <input type="checkbox" checked={f[r.k]} onChange={() => toggle(r.k)} className="size-4" />
          </label>
        ))}
      </div>
      <div className="flex justify-end pt-2">
        <button onClick={() => { saveNotifs(f); toast.success("Notification preferences saved"); }}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-semibold">Save Changes</button>
      </div>
    </Section>
  );
}
