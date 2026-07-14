import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/onboarding/buyer")({
  head: () => ({ meta: [{ title: "Register as Buyer — PSG" }] }),
  component: BuyerOnboarding,
});

function BuyerOnboarding() {
  const [done, setDone] = useState(false);
  if (done) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="size-16 mx-auto rounded-full bg-success/15 text-success grid place-items-center">
            <CheckCircle2 size={36} />
          </div>
          <h1 className="font-display text-4xl mt-4">You're in. Welcome to PSG.</h1>
          <p className="text-muted-foreground mt-2">
            Light verification is auto-approved instantly. Upload your DTI/Mayor's permit to unlock orders over ₱50K.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link to="/products" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-semibold">Browse marketplace</Link>
            <Link to="/dashboard/buyer" className="border px-5 py-2.5 rounded-md font-semibold">Buyer dashboard</Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">← Back to PSG</Link>
        <h1 className="font-display text-4xl mt-2">Register as a buyer</h1>
        <p className="text-muted-foreground mt-1">Free. Instant. Verified buyers unlock RFQs and higher escrow limits.</p>

        <form onSubmit={(e) => { e.preventDefault(); setDone(true); }} className="mt-8 space-y-5 bg-card border rounded-lg p-6">
          <Field label="Business name"><input className="input" defaultValue="Lola Nena's Carinderia Group" required /></Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Business type">
              <select className="input" required>
                <option>Carinderia</option><option>Restaurant</option><option>Hotel</option>
                <option>Pharmacy</option><option>Contractor</option><option>School</option>
                <option>Office</option><option>Sari-sari store</option><option>Other</option>
              </select>
            </Field>
            <Field label="Branches"><input className="input" type="number" defaultValue="8" /></Field>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Your name"><input className="input" defaultValue="Joenel Tan" required /></Field>
            <Field label="Role"><input className="input" defaultValue="Procurement Lead" /></Field>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Email"><input className="input" type="email" defaultValue="joenel@lolanenas.ph" required /></Field>
            <Field label="Mobile"><input className="input" defaultValue="+63 917 555 0188" required /></Field>
          </div>
          <Field label="Primary delivery address"><input className="input" defaultValue="14 Roces Ave, Project 8, Quezon City" /></Field>
          <Field label="Categories you usually buy">
            <div className="flex flex-wrap gap-2 mt-1">
              {["Rice & Grains", "Vegetables", "Seafood", "Beverages", "Coffee", "Paper", "Packaging"].map((c) => (
                <button key={c} type="button" className="chip chip-primary">{c}</button>
              ))}
            </div>
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" defaultChecked className="mt-1" />
            <span className="text-muted-foreground">
              I agree to PSG's Terms of Service and Escrow Policy. PSG holds my payments until I confirm delivery.
            </span>
          </label>
          <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-md">
            Create my buyer account
          </button>
        </form>
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-input);border-radius:.5rem;padding:.6rem .75rem;background:var(--color-background);font-size:.875rem}`}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm font-semibold mb-1">{label}</div>
      {children}
    </label>
  );
}
