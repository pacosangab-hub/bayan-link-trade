import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { CheckCircle2, Upload, Building2 } from "lucide-react";

export const Route = createFileRoute("/onboarding/supplier")({
  head: () => ({ meta: [{ title: "Become a Supplier — PSG" }] }),
  component: SupplierOnboarding,
});

const steps = ["Account", "Business info", "Permits & KYC", "First product", "Go live"];

function SupplierOnboarding() {
  const [step, setStep] = useState(0);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">← Back to PSG</Link>
        <h1 className="font-display text-4xl mt-2">Become a PSG supplier</h1>
        <p className="text-muted-foreground">5-minute application. Verification typically completes in 24h.</p>

        {/* Stepper */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div className={`size-7 rounded-full grid place-items-center text-xs font-bold ${
                i < step ? "bg-success text-white" : i === step ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <div className={`text-sm font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</div>
              {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-card border rounded-lg p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Create your account</h2>
              <Field label="Full name"><input className="input" defaultValue="Aling Marisol Mendoza" /></Field>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Email"><input className="input" type="email" defaultValue="marisol@bulacanrice.ph" /></Field>
                <Field label="Mobile"><input className="input" defaultValue="+63 917 555 0142" /></Field>
              </div>
              <Field label="Password"><input className="input" type="password" defaultValue="••••••••••" /></Field>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg flex items-center gap-2"><Building2 size={20} /> About your business</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Business name"><input className="input" defaultValue="Bulacan Grain & Rice Mills Inc." /></Field>
                <Field label="Type">
                  <select className="input"><option>Manufacturer</option><option>Distributor</option><option>Farmer Co-op</option><option>Importer</option></select>
                </Field>
                <Field label="Region"><select className="input"><option>Central Luzon</option></select></Field>
                <Field label="City"><input className="input" defaultValue="Malolos, Bulacan" /></Field>
                <Field label="Years operating"><input className="input" type="number" defaultValue="14" /></Field>
                <Field label="Employees"><input className="input" defaultValue="35" /></Field>
              </div>
              <Field label="What do you sell? (max 5 categories)">
                <div className="flex flex-wrap gap-2 mt-1">
                  {["Rice & Grains", "Flour", "Vegetables", "Seafood", "Coffee", "Packaging"].map((c) => (
                    <button key={c} type="button" className="chip chip-primary">{c}</button>
                  ))}
                </div>
              </Field>
              <Field label="Short description">
                <textarea className="input min-h-[100px]" defaultValue="Family-run rice mill operating since 2011. Specializing in NFA-grade premium and well-milled rice for foodservice and retail." />
              </Field>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Upload your permits</h2>
              <p className="text-sm text-muted-foreground">PSG verifies these in 24h. Verified status unlocks full marketplace visibility.</p>
              <div className="grid md:grid-cols-2 gap-3">
                {["DTI / SEC Registration", "BIR Registration (2303)", "Mayor's Permit", "FDA License (if applicable)", "Bank Account Proof", "Valid Government ID"].map((d) => (
                  <UploadField key={d} label={d} />
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-lg">Add your first product</h2>
              <p className="text-sm text-muted-foreground">You can upload your full catalog after launch. Start with one bestseller.</p>
              <Field label="Product title"><input className="input" defaultValue="Premium Well-Milled Rice (Sinandomeng)" /></Field>
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Unit"><input className="input" defaultValue="50 kg sack" /></Field>
                <Field label="MOQ"><input className="input" type="number" defaultValue="10" /></Field>
                <Field label="Price / unit"><input className="input" defaultValue="₱2,450" /></Field>
              </div>
              <Field label="Photos">
                <div className="border-2 border-dashed rounded-md p-8 text-center text-sm text-muted-foreground">
                  Drop product photos here · JPG / PNG up to 5MB
                </div>
              </Field>
            </div>
          )}
          {step === 4 && (
            <div className="text-center py-6">
              <div className="size-16 mx-auto rounded-full bg-success/15 text-success grid place-items-center">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="font-display text-3xl mt-4">Application submitted!</h2>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                Our verification team will review within 24h. You'll receive an email when your supplier profile goes live.
              </p>
              <div className="mt-6 flex gap-2 justify-center">
                <Link to="/supplier-portal" className="bg-primary text-primary-foreground px-5 py-2.5 rounded-md font-semibold">
                  Go to Supplier Portal
                </Link>
                <Link to="/" className="border px-5 py-2.5 rounded-md font-semibold">Back to PSG</Link>
              </div>
            </div>
          )}

          {step < 4 && (
            <div className="flex justify-between mt-8 pt-5 border-t">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                className="text-sm font-semibold text-muted-foreground"
                disabled={step === 0}
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(step + 1)}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md font-semibold"
              >
                Continue →
              </button>
            </div>
          )}
        </div>
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
function UploadField({ label }: { label: string }) {
  return (
    <div className="border rounded-md p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <button type="button" className="mt-2 w-full border-2 border-dashed rounded py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-1.5">
        <Upload size={14} /> Upload
      </button>
    </div>
  );
}
