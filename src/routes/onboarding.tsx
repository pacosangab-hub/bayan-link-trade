import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth, setAuthUser, getAuthUser } from "@/lib/auth-store";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Get Started — PSG" }] }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/login", replace: true });
  }, [isAuthenticated]);

  // Step 1
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("Restaurant");
  const [industry, setIndustry] = useState("Food Service");
  const [location, setLocation] = useState("");
  const [region, setRegion] = useState("NCR");
  const [phone, setPhone] = useState("");
  const [bizEmail, setBizEmail] = useState(user?.email || "");

  // Step 2 (varies by role)
  const [step2, setStep2] = useState<Record<string, string>>({});

  if (!user) return null;

  const role = user.role;
  const showBuyer = role === "buyer" || role === "both" || role === "admin";
  const showSupplier = role === "supplier" || role === "both";

  function next() { setStep((s) => Math.min(s + 1, 3)); }
  function back() { setStep((s) => Math.max(s - 1, 1)); }

  function finishStep1(e: React.FormEvent) {
    e.preventDefault();
    const current = getAuthUser();
    if (current) setAuthUser({ ...current, businessName });
    next();
  }

  function finishStep2(e: React.FormEvent) {
    e.preventDefault();
    next();
  }

  function finishAll() {
    toast.success("You're all set!");
    if (role === "admin") navigate({ to: "/admin" });
    else if (role === "supplier") navigate({ to: "/supplier-portal" });
    else navigate({ to: "/products" });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <span>Step {step} of 3</span>
        </div>
        <h1 className="font-display text-3xl mt-1">
          {step === 1 && "Business profile"}
          {step === 2 && "Tell us how you'll use PSG"}
          {step === 3 && "You're ready to go"}
        </h1>

        {step === 1 && (
          <form onSubmit={finishStep1} className="mt-6 space-y-4 bg-card border rounded-lg p-6">
            <Field label="Business name"><input required className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} /></Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Business type">
                <select className="input" value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                  <option>Restaurant</option><option>Carinderia</option><option>Hotel</option>
                  <option>Pharmacy</option><option>Contractor</option><option>School</option>
                  <option>Office</option><option>Sari-sari store</option><option>Manufacturer</option>
                  <option>Distributor</option><option>Other</option>
                </select>
              </Field>
              <Field label="Industry"><input className="input" value={industry} onChange={(e) => setIndustry(e.target.value)} /></Field>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Location (city)"><input required className="input" value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
              <Field label="Region">
                <select className="input" value={region} onChange={(e) => setRegion(e.target.value)}>
                  <option>NCR</option><option>CAR</option><option>Region I</option><option>Region II</option>
                  <option>Region III</option><option>Region IV-A</option><option>Region IV-B</option>
                  <option>Region V</option><option>Region VI</option><option>Region VII</option>
                  <option>Region VIII</option><option>Region IX</option><option>Region X</option>
                  <option>Region XI</option><option>Region XII</option><option>Region XIII</option>
                  <option>BARMM</option>
                </select>
              </Field>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Contact number"><input required className="input" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
              <Field label="Business email"><input type="email" required className="input" value={bizEmail} onChange={(e) => setBizEmail(e.target.value)} /></Field>
            </div>
            <button type="submit" className="w-full bg-primary text-primary-foreground font-semibold rounded-md py-2.5">Continue</button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={finishStep2} className="mt-6 space-y-6 bg-card border rounded-lg p-6">
            {showBuyer && (
              <section className="space-y-3">
                <h2 className="font-semibold">As a buyer</h2>
                <Field label="What products do you usually buy?">
                  <input className="input" placeholder="e.g. rice, cooking oil, packaging" onChange={(e) => setStep2({ ...step2, buyProducts: e.target.value })} />
                </Field>
                <Field label="How often do you source suppliers?">
                  <select className="input" onChange={(e) => setStep2({ ...step2, cadence: e.target.value })}>
                    <option>Weekly</option><option>Monthly</option><option>Quarterly</option><option>Occasionally</option>
                  </select>
                </Field>
                <Field label="Preferred location of suppliers">
                  <input className="input" placeholder="e.g. NCR, Luzon, nationwide" onChange={(e) => setStep2({ ...step2, buyerLocation: e.target.value })} />
                </Field>
              </section>
            )}
            {showSupplier && (
              <section className="space-y-3">
                <h2 className="font-semibold">As a supplier</h2>
                <Field label="What products do you sell?">
                  <input className="input" onChange={(e) => setStep2({ ...step2, sellProducts: e.target.value })} />
                </Field>
                <Field label="Main categories">
                  <input className="input" placeholder="e.g. Rice & Grains, Beverages" onChange={(e) => setStep2({ ...step2, sellCategories: e.target.value })} />
                </Field>
                <Field label="Service areas">
                  <input className="input" placeholder="Regions or 'nationwide'" onChange={(e) => setStep2({ ...step2, serviceAreas: e.target.value })} />
                </Field>
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> Can issue invoice</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" /> Offers delivery</label>
                </div>
              </section>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={back} className="flex-1 border rounded-md py-2.5 font-semibold">Back</button>
              <button type="submit" className="flex-1 bg-primary text-primary-foreground font-semibold rounded-md py-2.5">Continue</button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="mt-6 text-center bg-card border rounded-lg p-10">
            <div className="size-14 mx-auto rounded-full bg-success/15 text-success grid place-items-center">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="font-display text-2xl mt-4">You're all set, {user.fullName.split(" ")[0]}!</h2>
            <p className="text-muted-foreground mt-2">
              Your business profile is ready. You can complete verification anytime for higher limits.
            </p>
            <button onClick={finishAll} className="mt-6 bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-md">
              Go to my {role === "supplier" ? "supplier portal" : role === "admin" ? "admin console" : "marketplace"}
            </button>
          </div>
        )}

        <Outlet />
      </div>
      <style>{`.input{width:100%;border:1px solid var(--color-input);border-radius:.5rem;padding:.6rem .75rem;background:var(--color-background);font-size:.875rem}`}</style>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-sm font-semibold mb-1">{label}</div>{children}</label>;
}
